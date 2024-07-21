import FunctionParser from 'parse-function';
import decodeFn from 'webdetta/common/decode-function';

const parser = FunctionParser();
const encodeFn = val => {
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
    ? { type: 'function', value: encodeFn(v) }
    : { value: v }
  ])));
  
const decodeObj = (str) =>
  Object.fromEntries(Object.entries(JSON.parse(str)).map(([k, v]) => [
    k,
    v.type == 'function'
    ? decodeFn(v.value.args, v.value.body)
    : v.value
  ]));

export const SdkInstance = (rpc, entries) => {
  const instance = {};
  const bind = d => typeof d == 'function' ? d.bind(instance) : d;
  const define = (path, descriptor) => {
    let obj = instance;
    for (const k of path.slice(0, -1)) obj = (obj[k] ??= {});
    
    let { value, get, set, writable } = descriptor;
    if ('value' in descriptor) value = bind(value);
    if ('get' in descriptor) {
      const get_ = get;
      get = () => bind(get_());
    }
    Object.defineProperty(obj, path.at(-1), {
      value, writable,
      ...(get ? { get } : {}),
      ...(set ? { set } : {}),
      configurable: false,
      enumerable: true
    });
  }
  
  for (const e of entries) {
    if (!e.isEncoded) continue;
    e.rpcHandler = e.rpcHandler && decodeFn(e.rpcHandler.args, e.rpcHandler.body);
    e.instanceProperty = decodeObj(rpc, e.instanceProperty);
  }

  for (const { path, handlerId, rpcHandler, instanceProperty } of entries) {
    if (rpcHandler && rpc) rpc.methods[handlerId] = rpcHandler;
    define(path, instanceProperty);
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

const remoteFunction = (func) => ({
  rpcHandler: null,
  instanceProperty: { writable: false, value: func }
});

const localFunction = (func) => ({
  rpcHandler: func,
  instanceProperty: { writable: false, value: func }
});

export const ClientHandler = NestedSdkEntry((val) => {
  const { args, body } = encodeFn(val);
  return {
    client: (handlerId) => localFunction(new Function(...args, body)),
    server: (handlerId) => remoteFunction(function () {
      return this.call(handlerId, ...arguments);
    }),
  };
});

export const ServerHandler = NestedSdkEntry((val) => {
  const { args, body } = encodeFn(val);
  return {
    client: (handlerId) => remoteFunction(new Function(...args,
      `return this.call(${JSON.stringify(handlerId)}, ...arguments);`
    )),
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
        rpcHandler: cli.rpcHandler && encodeFn(cli.rpcHandler),
        instanceProperty: encodeObj(cli.instanceProperty)
      });
      
      const srv = d.server(handlerId);
      serverEntries.push({
        path: fullpath, handlerId, isEncoded: false,
        rpcHandler: function() {
          this.instance ??= SdkInstance(null, serverEntries);
          return srv.rpcHandler.apply(this.instance, arguments);
        },
        instanceProperty: srv.instanceProperty
      });
    }
  }
  for (const d of clientEntries) console.log('---', d);
  for (const d of serverEntries) console.log('+++', d);
  
  SdkInstance({ methods: serverMethods }, serverEntries);
  
  console.log(clientCode('localhost'));
  return { serverMethods, clientCode };
}
