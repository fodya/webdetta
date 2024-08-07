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
const stateValue = (handlerId, initial, sync) => {
  const initval = [
    `const V = this["#internals"]["#vals"] ??= {};`,
    `const H = ${JSON.stringify(handlerId)};`,
    `if (!(H in V)) V[H] = JSON.parse(${JSON.stringify(initial)});`,
  ];
  return {
    rpcHandler: !sync ? null : new Function('...a', [
      ...initval,
      `return a.length > 0 ? (V[H] = a[0]) : V[H];`
    ].join('')),
    instanceProperty: {
      get: new Function([
        ...initval,
        `return V[H];`
      ].join('')),
      set: new Function('value', [
        ...initval,
        `V[H] = value;`,
        !sync ? '' :
        `this["#internals"].cast(${JSON.stringify(handlerId)}, value);`
      ].join('')),
    }
  };
}

const AsyncFunction = (async () => {}).constructor;
const Function_ = awaitResult => ({
  Client: NestedSdkEntry((func) => {
    const { args, body, isAsync } = parseFn(func);
    return {
      client: (handlerId) => localFunction(
        new (isAsync ? AsyncFunction : Function)(...args, body)
      ),
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
export const State = {
  Client: SdkEntry((initial) => ({
    client: stateValue(handlerId, initial, false),
    server: null
  })),
  Server: SdkEntry((initial) => ({
    client: null,
    server: stateValue(handlerId, initial, false)
  })),
  Sync: SdkEntry((initial) => ({
    client: (handlerId) => stateValue(handlerId, initial, true),
    server: (handlerId) => stateValue(handlerId, initial, true)
  }))
};

export const validateSdkEntry = (entry) => {
  if (!(SDK_ENTRY in entry)) {
    throw new Error([
      'SDK entries must be decorated with one of the following functions: ',
      'Func, Event, State.'
    ].join(''));
  }
}
