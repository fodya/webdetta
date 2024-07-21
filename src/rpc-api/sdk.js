import FunctionParser from 'parse-function';
const parser = FunctionParser();

export const SdkClient = (rpc, entries) => {
  const instance = {};
  const define = (path, descriptor) => {
    let obj = instance;
    for (const k of path.slice(0, -1)) obj = (obj[k] ??= {});
    Object.defineProperty(obj, path.at(-1), descriptor);
  }
  
  for (const { path, handlerId, rpcHandler, propertyDescriptor } of entries) {
    rpc.methods[handlerId] = rpcHandler;
    define(path, propertyDescriptor);
  }
    
  Object.preventExtensions(instance);
  return instance;
}

class SdkEntry {
  constructor({ client, server }) {
    Object.assign(this, { client, server });
  }
}

const validateHandler = (val) => {
  if (typeof val == 'object') {
    for (const k of Object.keys(val)) {
      validateHandler(val[k]);
    }
  } else if (typeof val != 'function') {
    throw new Error([ 
      'ServerHandler value must be a function ',
      'or a nested plain object containing a collection of functions.'
    ].join(''));
  }
}

const serializeFunction = val => {
  const { args, defaults, body } = parser.parse(val);
  const args_ = args
    .map(d => defaults[d] ? d + '=' + defaults[d] : d)
    .join(', ');
  return { args: args_, body };
}

const remoteFunction = (handlerId, args) => {
  const handler = new Function(...args,
    `return rpc.call(${JSON.stringify(handlerId)}, ...arguments);`
  );
  return {
    rpcHandler: null,
    propertyDescriptor: { value: handler }
  }
}

const localFunction = (args, body) => {
  const handler = new Function(...args, body);
  return {
    rpcHandler: handler,
    propertyDescriptor: { value: handler }
  };
}

export const ClientHandler = (val) => {
  const { args, body } = serializeFunction(val);
  return new SdkEntry({
    client: (handlerId) => localFunction(args, body),
    server: (handlerId) => remoteFunction(handlerId, args),
  });
}

export const ServerHandler = (val) => {
  const { args, body } = serializeFunction(val);
  return new SdkEntry({
    client: (handlerId) => remoteFunction(handlerId, args),
    server: (handlerId) => localFunction(args, body)
  });
}

export const SdkServer = (sdkDefinition) => {
  const handlers = {};
  const clientCode = rpcURL => [
    `import { RpcClient } from 'webdetta/rpc/client';`,
    `import { SdkClient } from 'webdetta/rpc-api/sdk';`,
    `const rpc = RpcClient("${rpcURL}");`,
    `export default { chats: { list: () => [1,2,3] } };`
  ].join('\n');
  
  const traverseHandler = (val, path=[], res=[]) => {
    if (typeof val == 'object') {
      for (const [k, v] of Object.entries(val)) {
        traverseHandler(v, [...path, k], res);
      }
    }
    if (typeof val == 'function') {
      const { args, defaults, body } = parser.parse(val);
      const args_ = args
        .map(d => defaults[d] ? d + '=' + defaults[d] : d)
        .join(', ');
      res.push({ path: path, args: args_, body: body });
    }
    return res;
  }
  
  for (const [key, entry] of Object.entries(sdkDefinition)) {
    if (!(entry instanceof Entry)) {
      throw new Error([
        'SDK entries must be decorated with one of the following functions: ',
        'ClientState, ClientHandler, SharedState, ServerState, ServerHandler.'
      ].join(''));
    }
    console.log(entry);
  }

  return { handlers, clientCode };
}
