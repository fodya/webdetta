import FunctionParser from 'parse-function';
const parser = FunctionParser();

export const generateSDK = (methods) => {
  const handlers = {};
  const codeEntries = [
    `import { RpcClient } from 'webdetta/rpc/client';`,
    `const rpc = RpcClient("{{rpcURL}}");`,
    `const methods = {};`
  ];
  const codeDefine = (path, str) => codeEntries.push(
    `methods${path.map(d => `[${JSON.stringify(d)}]`).join('')} = ${str};`
  );
  const codeAppendix = `export default methods;`;

  const publish = (entry, path=[]) => {
    if (typeof entry == 'object') {
      for (const [k, v] of Object.entries(entry)) {
        if (path.length > 0) codeDefine(path, `{}`);
        publish(v, [...path, k]);
      }
    } else if (typeof entry == 'function') {
      const handlerId = path.join('.');
      handlers[handlerId] = entry;

      const { args, defaults } = parser.parse(entry);
      const [fnargs, fnbody] = [
        args.map(d => defaults[d] ? d + '=' + defaults[d] : d).join(', '),
        `return rpc.call(${JSON.stringify(handlerId)}, ...arguments)`
      ];
      codeDefine(path, `function (${fnargs}) {${fnbody}}`);
    } else {
      throw new Error('Only plain objects and functions are supported.');
    }
  }
  publish(methods);
  
  const clientCode = (() => {
    const str = [...codeEntries, codeAppendix].join('\n');
    return rpcURL => str.replace('{{rpcURL}}', rpcURL);
  })();
  return { handlers, clientCode };
}
