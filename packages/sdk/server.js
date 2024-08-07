import { parseSdkDefinition } from './defs.js';
import { SdkInstance } from './instance.js';
import { parseFn } from './common.js';

const obj2code = (obj, vars, pad='  ') => {
  if (typeof obj == 'function') {
    const { args, body, isAsync } = parseFn(obj);
    return [
      isAsync ? 'async' : '',
      `function (${args.join(',')})`,
      `{var ${vars.join(',')};${body.trim()}}`
    ].join(' ');
  }
  if (Array.isArray(obj))
    return `[${obj.map(d => obj2code(d, vars, pad)).join(',')}]`;
  if (typeof obj == 'object' && obj !== null)
    return '{\n' +
      Object.entries(obj).map(([k, v]) =>
        pad + JSON.stringify(k) + ':' + obj2code(v, vars, pad + '  ')
      ).join(',\n')
    + `\n${pad.slice(0, -2)}}`;
  return JSON.stringify(obj);
}

export const SdkServer = (methods) => {
  const clientEntries = [];
  const clientCodeCache = {};
  const clientCode = rpcURL => clientCodeCache[rpcURL] ??= [
    `import SDK from "webdetta/sdk/client";`,
    `export default SDK.WS("${rpcURL}", ${obj2code(clientEntries, ['SDK'])});`
  ].join('\n');

  const serverMethods = {};
  const serverEntries = [];
  console.log(methods, parseSdkDefinition(methods));
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
  isSecure,
  clientCode,
  transport='ws'
}) => async (req, res) => {
  const url = Object.assign(new URL('http://localhost'), {
    host: req.headers.host,
    protocol: isSecure ? 'wss:' : 'ws:',
    pathname: req.baseUrl + req.path,
    search: ''
  });
  let code = clientCode(url, transport);
  if (!('raw' in req.query))
    code = bundledCode[[url, transport]] ??= await bundleCode(code);
  res.contentType('text/javascript');
  res.send(code);
}
