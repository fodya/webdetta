import { parseSdkDefinition } from './defs.js';
import { SdkInstance } from './instance.js';
import { parseFn, obj2code } from './common.js';

export const SdkServer = (methods) => {
  const clientEntries = [];
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

  const clientCode = [
    `import SDK from "webdetta/sdk/client";`,
    `export default SDK.WS(import.meta.url, ${obj2code(clientEntries, ['SDK'])});`
  ].join('\n');

  return { serverMethods, clientCode };
}

import {rollup} from 'rollup';
import PluginVirtual from '@rollup/plugin-virtual';
import NodeResolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
const bundleCode = async ({ sourcemap, code }) => {
  const bundle = await rollup({
    input: 'code',
    plugins: [
      PluginVirtual({ code }),
      NodeResolve(),
      babel({
        babelHelpers: 'bundled',
        presets: [['@babel/preset-env', {
          targets: { ie: "11" },
          useBuiltIns: "usage"
        }]]
      })
    ],
  });
  const result = await bundle.generate({
    format: 'es',
    sourcemap: sourcemap ? 'inline' : false
  });
  return result.output[0].code;
}

const bundledCode = {};
SdkServer.clientCodeHttpHandler = ({ sourcemap, code }) => async (req, res) => {
  const pathname = req.baseUrl + req.path;
  res.contentType('text/javascript');
  res.send(
    'raw' in req.query
    ? code
    : bundledCode[pathname] ??= await bundleCode({ sourcemap, code })
  );
}
