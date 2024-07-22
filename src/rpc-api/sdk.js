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

const obj2code = (obj) => {
  if (typeof obj == 'function') {
    const { args, body } = encodeFn(obj);
    return `function (${args}) {${body}}`;
  }
  if (Array.isArray(obj))
    return `[${obj.map(obj2code).join(',')}]`;
  if (typeof obj == 'object' && obj !== null)
    return `{${Object.entries(obj).map(([k, v]) =>
      [JSON.stringify(k), obj2code(v)].join(':')
    ).join(',')}}`
  return JSON.stringify(obj);
}
  
const defineProperty = (instance, path, descriptor) => {
  const bind = d => typeof d == 'function' ? d.bind(instance) : d;

  let obj = instance;
  for (const k of path.slice(0, -1)) obj = (obj[k] ??= {});
  
  let { value, get, set, writable } = descriptor;
  const descr = {
    configurable: false,
    enumerable: true
  };
  if ('value' in descriptor) {
    descr.value = bind(value);
  }
  if ('writable' in descriptor) {
    descr.writable = writable;
  }
  if ('get' in descriptor) {
    const get_ = bind(get);
    descr.get = () => bind(get_());
  }
  if ('set' in descriptor) {
    const set_ = bind(set);
    descr.set = () => bind(set_());
  }
  Object.defineProperty(obj, path.at(-1), descr);
}

export const SdkInstance = (rpcInstance, methods, entries) => {
  const instance = {};
  
  for (const e of entries) {
    if (!e.isEncoded) continue;
    e.rpcHandler = e.rpcHandler && decodeFn(e.rpcHandler.args, e.rpcHandler.body);
    e.instanceProperty = e.instanceProperty;
  }
  
  if (rpcInstance) defineProperty(instance, ['#internals'], {
    value: rpcInstance,
    writable: false
  });

  for (const { path, handlerId, rpcHandler, instanceProperty } of entries) {
    if (methods && rpcHandler) methods[handlerId] = rpcHandler;
    defineProperty(instance, path, instanceProperty);
  }
  
  Object.preventExtensions(instance);
  return instance;
}

export const SdkServer = (sdkDefinition) => {
  const clientEntries = [];
  const clientCode = rpcURL => [
    `import { RpcClient } from 'webdetta/rpc/client';`,
    `import { SdkInstance } from 'webdetta/rpc-api/sdk';`,
    `const rpc = RpcClient("${rpcURL}");`,
    `const clientEntries = ${obj2code(clientEntries)};`,
    `export default SdkInstance(rpc, rpc.methods, clientEntries);`
  ].join('\n');
  
  const serverMethods = {};
  const serverEntries = [];
  
  for (const [key, entry] of Object.entries(sdkDefinition)) {
    if (!(SDK_ENTRY in entry)) {
      throw new Error([
        'SDK entries must be decorated with one of the following functions: ',
        'Func, Proc, State.'
      ].join(''));
    }
    
    for (const d of entry.list) {
      const fullpath = [key, ...d.path];
      const handlerId = fullpath.join(',');
      
      const cli = d.client(handlerId);
      clientEntries.push({
        path: fullpath, handlerId, isEncoded: true,
        rpcHandler: cli.rpcHandler && encodeFn(cli.rpcHandler),
        instanceProperty: cli.instanceProperty
      });
      
      const srv = d.server(handlerId);
      serverEntries.push({
        path: fullpath, handlerId, isEncoded: false,
        rpcHandler: function() {
          this.instance ??= SdkInstance(this, null, serverEntries);
          return srv.rpcHandler.apply(this.instance, arguments);
        },
        instanceProperty: srv.instanceProperty
      });
    }
  }
  for (const d of clientEntries) console.log('---', d);
  for (const d of serverEntries) console.log('+++', d);
  
  SdkInstance(null, serverMethods, serverEntries);
  
  console.log(clientCode('localhost'));
  return { serverMethods, clientCode };
}

//

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

const remoteFunction = (handlerId, signature, awaitResult) => ({
  rpcHandler: null,
  instanceProperty: {
    writable: false,
    value: new Function(...signature, [
      `return this["#internals"].${awaitResult ? 'call' : 'cast'}`,
      `(${JSON.stringify(handlerId)}, ...arguments);`
    ].join(''))
  }
});
const localFunction = (func) => ({
  rpcHandler: func,
  instanceProperty: { writable: false, value: func }
});

const Function_ = awaitResult => ({
  Client: NestedSdkEntry((func) => {
    const { args, body } = encodeFn(func);
    return {
      client: (handlerId) => localFunction(new Function(...args, body)),
      server: (handlerId) => remoteFunction(handlerId, args, awaitResult),
    };
  }),
  Server: NestedSdkEntry((func) => {
    const { args, body } = encodeFn(func);
    return {
      client: (handlerId) => remoteFunction(handlerId, args, awaitResult),
      server: (handlerId) => localFunction(func)
    };
  })
});

export const Func = Function_(true);
export const Proc = Function_(false);
