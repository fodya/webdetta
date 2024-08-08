import { parseSdkDefinition } from './defs.js';
import { SdkInstance } from './instance.js';
import { parseFn, obj2code } from './common.js';

export const SdkServer = (methods) => {
  const clientEntries = [];
  const clientCodeCache = {};
  const clientCode = rpcURL => clientCodeCache[rpcURL] ??= [
    `import SDK from "webdetta/sdk/client";`,
    `export default SDK.WS("${rpcURL}", ${obj2code(clientEntries, ['SDK'])});`
  ].join('\n');

  const serverMethods = {};
  const serverEntries = [];
  for (const [keypath, entry] of parseSdkDefinition(methods)) {
    for (const d of entry.list) {
      const fullpath = [...keypath, ...d.path];
      const handlerId = fullpath.join('.');

      const cli = d?.client?.(handlerId);
      if (cli) clientEntries.push({
        path: fullpath,
        instanceProperty: cli.instanceProperty,
        rpcHandler: cli.rpcHandler && {
          id: handlerId,
          value: cli.rpcHandler
        },
      });

      const srv = d?.server?.(handlerId);
      if (srv) serverEntries.push({
        path: fullpath,
        instanceProperty: srv.instanceProperty,
        rpcHandler: srv.rpcHandler && {
          id: handlerId,
          value: function() {
            this.instance ??= SdkInstance(this, null, serverEntries);
            return srv.rpcHandler.apply(this.instance, arguments);
          }
        },
      });
    }
  }
  SdkInstance(null, serverMethods, serverEntries);

  return { serverMethods, clientCode };
}

import {rollup} from 'rollup';
import PluginVirtual from '@rollup/plugin-virtual';
import NodeResolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
const bundleCode = async code => {
  const bundle = await rollup({
    input: 'code',
    plugins: [PluginVirtual({ code }), NodeResolve(), terser()],
  });
  const result = await bundle.generate({ format: 'es' });
  return result.output[0].code;
}

const bundledCode = {};
SdkServer.clientCodeHttpHandler = ({
  clientCode,
  transport='ws'
}) => async (req, res) => {
  const url = Object.assign(new URL('http://localhost'), {
    host: req.headers.host,
    protocol: req.secure ? 'wss:' : 'ws:',
    pathname: req.baseUrl + req.path,
    search: ''
  });
  let code = clientCode(url, transport);
  if (!('raw' in req.query))
    code = bundledCode[[url, transport]] ??= await bundleCode(code);
  res.contentType('text/javascript');
  res.send(code);
}
