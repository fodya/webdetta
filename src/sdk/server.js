import { validateSdkEntry } from './defs.js';
import { SdkInstance } from './instance.js';
import { parseFn } from './common.js';

const obj2code = (obj, vars, pad='  ') => {
  if (typeof obj == 'function') {
    const { args, body } = parseFn(obj);
    return
      `function (${args.join(',')}) {var ${vars.join(',')};${body.trim()}}`;
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
  
  for (const [key, entry] of Object.entries(methods)) {
    validateSdkEntry(entry);
    for (const d of entry.list) {
      const fullpath = [key, ...d.path];
      const handlerId = fullpath.join('.');
      
      const cli = d.client(handlerId);
      clientEntries.push({
        path: fullpath,
        instanceProperty: cli.instanceProperty,
        rpcHandler: cli.rpcHandler && {
          id: handlerId,
          value: cli.rpcHandler
        },
      });
      
      const srv = d.server(handlerId);
      serverEntries.push({
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

SdkServer.clientCodeHttpHandler = ({
  isSecure,
  clientCode,
  transport='ws'
}) => (req, res) => {
  const url = Object.assign(new URL('http://localhost'), {
    host: req.headers.host,
    protocol: isSecure ? 'wss:' : 'ws:',
    pathname: req.baseUrl + req.path
  });
  res.contentType('text/javascript');
  res.send(clientCode(url, transport));
}
