import { parseFn, obj2code } from './common.js';

const traverseSdkObject = (val, func, path=[], res=[]) => {
  if (typeof val == 'object' && val && SDK_ENTRY in val) {
    res.push(...val.list.map(entry => ({
      ...entry,
      path: path.concat(entry.path)
    })));
  } else if (typeof val == 'object' && val) {
    for (const [k, v] of Object.entries(val))
      traverseSdkObject(v, func, [...path, k], res);
  } else if (typeof val == 'function') {
    res.push({ ...func(val), path });
  } else {
    throw new Error([
      'The value must be a function ',
      'or a nested object containing a collection of functions.'
    ].join(''));
  }
  return res;
}

const SDK_ENTRY = Symbol('SDK_ENTRY');
const SdkEntry = (func) => val => ({
  [SDK_ENTRY]: true,
  list: [{ ...func(val), path: [] }]
});
const NestedSdkEntry = (func) => val => ({
  [SDK_ENTRY]: true,
  list: traverseSdkObject(val, func)
});

const remoteFunction = (handlerId, signature, awaitResult) => ({
  rpcHandler: null,
  instanceProperty: {
    writable: false,
    value: new Function(...signature, [
      `return this["#internals"].rpc.${awaitResult ? 'call' : 'cast'}`,
      `(${JSON.stringify(handlerId)}, ...arguments);`
    ].join(''))
  }
});
const localFunction = (func) => ({
  rpcHandler: func,
  instanceProperty: { writable: false, value: func }
});
const syncValue = (handlerId, initial, allowRead, allowWrite) => {
  const vars = [
    `const V = this["#internals"].state ??= {};`,
    `const h = ${JSON.stringify(handlerId)};`
  ].join('');
  const init =
    `if (!(h in V)) V[h] = ${obj2code(initial)};`;
  return {
    rpcHandler: !allowRead ? null : new Function('...a',
      vars + init + `return a.length > 0 ? (V[h] = a[0]) : V[h];`
    ),
    instanceProperty: {
      get: new Function(vars + init + `return V[h];`),
      set: new Function('value',
        allowWrite
        ? vars + 'this["#internals"].rpc.cast(h, V[h] = value);'
        : vars + 'throw new Error(`SDK value ${h} is readonly`);'
      )
    }
  };
}

const AsyncFunction = (async () => {}).constructor;
const Function_ = awaitResult => ({
  Client: NestedSdkEntry((func) => {
    const { args, body, isAsync } = parseFn(func);
    return {
      client: (_handlerId) => localFunction(
        new (isAsync ? AsyncFunction : Function)(...args, body)
      ),
      server: (handlerId) => remoteFunction(handlerId, args, awaitResult),
    };
  }),
  Server: NestedSdkEntry((func) => {
    const { args } = parseFn(func);
    return {
      client: (handlerId) => remoteFunction(handlerId, args, awaitResult),
      server: (_handlerId) => localFunction(func)
    };
  })
});

export const Func = Function_(true);
export const Event = Function_(false);
export const Value = {
  Static: SdkEntry((initial) => ({
    client: (handlerId) => syncValue(handlerId, initial, false, false),
    server: (handlerId) => syncValue(handlerId, initial, false, false),
  })),
  Client: SdkEntry((initial) => ({
    client: (handlerId) => syncValue(handlerId, initial, false, true),
    server: (handlerId) => syncValue(handlerId, initial, true, false),
  })),
  Server: SdkEntry((initial) => ({
    client: (handlerId) => syncValue(handlerId, initial, true, false),
    server: (handlerId) => syncValue(handlerId, initial, false, true)
  })),
  Sync: SdkEntry((initial) => ({
    client: (handlerId) => syncValue(handlerId, initial, true, true),
    server: (handlerId) => syncValue(handlerId, initial, true, true)
  }))
};

export const parseSdkDefinition = (obj, path=[], res=[]) => {
  if (typeof obj == 'object') {
    for (const [k, v] of Object.entries(obj)) {
      const path1 = [...path, k];
      if (typeof v == 'object' && v && SDK_ENTRY in v) res.push([path1, v]);
      else parseSdkDefinition(v, path1, res);
    }
  } else {
    throw new Error([
      'SDK entries must be decorated with one of the following functions: ',
      'Func, Event, Value.'
    ].join(''));
  }
  return res;
}
