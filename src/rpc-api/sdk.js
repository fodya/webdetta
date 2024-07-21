import FunctionParser from 'parse-function';
import decodeFunction from './decode-function.js';

const parser = FunctionParser();
const encodeFunction = val => {
  const { args, defaults, body } = parser.parse(val);
  const args_ = args
    .map(d => defaults[d] ? d + '=' + defaults[d] : d)
    .join(', ');
  return { args: args_, body };
}

const encodeObj = (obj) =>
  JSON.stringify(Object.fromEntries(Object.entries(obj).map(([k, v]) => [
    k,
    typeof v == 'function'
    ? { type: 'function', value: encodeFunction(v) }
    : { value: v }
  ])));
  
const decodeObj = (rpc, instance, str) =>
  Object.fromEntries(Object.entries(JSON.parse(str)).map(([k, v]) => [
    k,
    v.type == 'function'
    ? decodeFunction(rpc, instance, v.args, v.body)
    : v.value
  ]));

export const SdkInstance = (rpc, entries) => {
  const instance = {};
  const define = (path, descriptor) => {
    let obj = instance;
    for (const k of path.slice(0, -1)) obj = (obj[k] ??= {});
    Object.defineProperty(obj, path.at(-1), descriptor);
  }
  
  for (const e of entries) {
    if (!e.isEncoded) continue;
    e.rpcHandler = e.rpcHandler &&
      decodeFunction(rpc, instance, e.rpcHandler.args, e.rpcHandler.body);
    e.propertyDescriptor =
      decodeObj(rpc, instance, e.propertyDescriptor);
  }

  for (const { path, handlerId, rpcHandler, propertyDescriptor } of entries) {
    if (rpcHandler && rpc) rpc.methods[handlerId] = rpcHandler;
    define(path, propertyDescriptor);
  }
    
  Object.preventExtensions(instance);
  return instance;
}

const traverseSdkObject = (val, path=[], res=[]) => {
  if (typeof val == 'object')
    for (const [k, v] of Object.entries(val)) 
      traverseSdkObject(v, [...path, k], res);
  else if (typeof val == 'function')
    res.push({ path: path, val });
  else
    throw new Error([ 
      'The value must be a function ',
      'or a nested object containing a collection of functions.'
    ].join(''));
  return res;
}

const SDK_ENTRY = Symbol('SDK_ENTRY');
const SdkEntry = (func) => val => ({
  [SDK_ENTRY]: true,
  list: [
    { path: [], ...func(val) }
  ]
});
const NestedSdkEntry = (func) => val => ({
  [SDK_ENTRY]: true,
  list: traverseSdkObject(val).map(d => (
    { path: d.path, ...func(d.val) }
  ))
});

const remoteFunction = (handlerId, args) => {
  const handler = new Function(...args,
    `return rpc.call(${JSON.stringify(handlerId)}, ...arguments);`
  );
  return {
    rpcHandler: null,
    propertyDescriptor: { value: handler }
  }
}

const localFunction = (handler) => {
  return {
    rpcHandler: handler,
    propertyDescriptor: { value: handler }
  };
}

export const ClientHandler = NestedSdkEntry((val) => {
  const { args, body } = encodeFunction(val);
  return {
    client: (handlerId) => localFunction(new Function(...args, body)),
    server: (handlerId) => remoteFunction(handlerId, args),
  };
});

export const ServerHandler = NestedSdkEntry((val) => {
  const { args, body } = encodeFunction(val);
  return {
    client: (handlerId) => remoteFunction(handlerId, args),
    server: (handlerId) => localFunction(val)
  };
});

export const SdkServer = (sdkDefinition) => {
  const clientEntries = [];
  const clientCode = rpcURL => [
    `import { RpcClient } from 'webdetta/rpc/client';`,
    `import { SdkInstance } from 'webdetta/rpc-api/sdk';`,
    `const rpc = RpcClient("${rpcURL}");`,
    `export default SdkInstance(rpc, ${JSON.stringify(clientEntries, null, 2)});`
  ].join('\n');
  
  const serverMethods = {};
  const serverEntries = [];
  
  for (const [key, entry] of Object.entries(sdkDefinition)) {
    if (!(SDK_ENTRY in entry)) {
      throw new Error([
        'SDK entries must be decorated with one of the following functions: ',
        'ClientState, ClientHandler, SharedState, ServerState, ServerHandler.'
      ].join(''));
    }
    
    for (const d of entry.list) {
      const fullpath = [key, ...d.path];
      const handlerId = fullpath.join(',');
      
      const cli = d.client(handlerId);
      clientEntries.push({
        path: fullpath, handlerId, isEncoded: true,
        rpcHandler: cli.rpcHandler && encodeFunction(cli.rpcHandler),
        propertyDescriptor: encodeObj(cli.propertyDescriptor)
      });
      
      const srv = d.server(handlerId);
      serverEntries.push({
        path: fullpath, handlerId, isEncoded: false,
        rpcHandler: srv.rpcHandler,
        propertyDescriptor: srv.propertyDescriptor
      });
    }
  }
  for (const d of clientEntries) console.log('---', d);
  for (const d of serverEntries) console.log('+++', d);
  
  SdkInstance({ methods: serverMethods }, serverEntries);
  console.log(clientCode('localhost'));
  return { serverMethods, clientCode };
}
