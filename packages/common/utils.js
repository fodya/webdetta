import { debug } from './debug.js';

const AsyncFunction = (async () => {}).constructor;
export const isAsync = f => f instanceof AsyncFunction;
export const isPromise = d => d == Promise.resolve(d);

export const callFn = d => typeof d == 'function' ? d() : d;
export const unwrapFn = d => typeof d == 'function' ? unwrapFn(d()) : d;
export const toFn = d => typeof d == 'function' ? d : () => d;

export const err = (...args) => {
  throw (
    isTemplateCall(args)
    ? new Error(String.raw(...args))
    : new Error(...args)
  );
};

export const S = (...args) =>
  String.raw(...args).match(/\S+/g) ?? [];

export const routeByArgsCount = (...funcs) => function () {
  return funcs[arguments.length].apply(this, arguments);
}

export const catchErrors = (f, handler=catchErrors.handler) => {
  const wrapped = function() {
    try {
      const res = f.apply(this, arguments);
      return isPromise(res) ? res.catch(handler) : res;
    }
    catch (e) {
      handler(e);
    }
  }
  return debug.linkOriginalFunction(f, wrapped);
}
catchErrors.handler = e => console.error(e);

export const once = (f) => {
  let called;
  return debug.linkOriginalFunction(f, function () {
    if (called) return;
    called = true;
    return f.apply(this, arguments);
  });
}

export const sleep = t => new Promise(r => setTimeout(r, t));

export const throttle = (f) => {
  let promise;
  const throttled = function () {
    if (promise) return promise;
    promise = Promise.resolve();
    const res = f.apply(this, arguments);
    return promise
      .then(() => res)
      .finally(() => (promise = null));
  }
  throttled.isLocked = () => !!promise;
  return debug.linkOriginalFunction(f, throttled);
}
throttle.sync = f => {
  let locked = false;
  const throttled = function() {
    if (locked) return;
    locked = true;
    let res; try { res = f.apply(this, arguments); }
    catch (err) { locked = false; throw err; }
    locked = false;
    return res;
  };
  throttled.isLocked = () => locked;
  return debug.linkOriginalFunction(f, throttled);
}
throttle.T = (delay, f) => throttle(async function () {
  await sleep(delay);
  return await f.apply(this, arguments);
});
throttle.Ti = (delay, f) => throttle(function () {
  const res = f.apply(this, arguments);
  return Promise.resolve(res).then(d => sleep(delay).then(() => d));
});
throttle.Td = (delay, f) => {
  let t = null, resolve, reject;
  const throttled = function() {
    return new Promise((rs, rj) => {
      clearTimeout(t);
      reject?.();
      [resolve, reject] = [rs, rj];
      t = setTimeout(() => {
        t = null;
        resolve(f.apply(this, arguments));
      }, delay);
    }).catch(e => {
      if (e) console.error(e);
    });
  }
  throttled.isLocked = () => t !== null;
  return debug.linkOriginalFunction(f, throttled);
}

export const cached = (f, keyFn=String, map=new Map()) => {
  const wrapped = function (...args) {
    const key = keyFn(...args);
    let result = map.get(key);
    if (result) return result;
    map.set(key, result = f.apply(this, args));
    return result;
  }
  return debug.linkOriginalFunction(f, wrapped);
}

export const isTemplateCall = args =>
  Array.isArray(args[0]) && objectHasOwn(args[0], 'raw');

export const templateCallToArray = args => {
  if (!isTemplateCall(args)) return args;
  let i = 0, result = [];
  for (let part of args[0]) {
    result.push(part);
    if (++i < args.length) result.push(args[i]);
  }
  return result;
}

export const objectHasOwn = (obj, key) =>
  Object.prototype.hasOwnProperty.call(obj, key);
export const objectMap = routeByArgsCount(
  null,
  (func) => {
    return (obj) => objectMap(obj, func);
  },
  (obj, func) => {
    const res = {};
    for (const [k, v] of Object.entries(obj)) res[k] = func(v, k, obj);
    return res;
  }
);
export const objectPick = routeByArgsCount(
  null,
  (keys) => {
    return (obj) => objectPick(obj, keys);
  },
  (obj, keys) => {
    return Object.fromEntries(keys.map(k => [k, obj[k]]));
  }
);
export const traverseObject = (obj, func) => {
  const run = (value, keys=[]) => {
    if (typeof value == 'object' && value != null) {
      for (const [key, val] of Object.entries(value)) {
        run(val, [...keys, key]);
      }
    }
    else if (typeof value == 'function') {
      func(keys, value);
    }
  }
  run(obj);
}