import { parseFn } from './common.js';

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
    const { args, body } = parseFn(func);
    return {
      client: (handlerId) => localFunction(new Function(...args, body)),
      server: (handlerId) => remoteFunction(handlerId, args, awaitResult),
    };
  }),
  Server: NestedSdkEntry((func) => {
    const { args, body } = parseFn(func);
    return {
      client: (handlerId) => remoteFunction(handlerId, args, awaitResult),
      server: (handlerId) => localFunction(func)
    };
  })
});

export const Func = Function_(true);
export const Event = Function_(false);

export const validateSdkEntry = (entry) => {
  if (!(SDK_ENTRY in entry)) {
    throw new Error([
      'SDK entries must be decorated with one of the following functions: ',
      'Func, Event, State.'
    ].join(''));
  }
}
