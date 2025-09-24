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

export const catchErrors = (f, handler=catchErrors.handler) => {
  return function() {
    try {
      const res = f.apply(this, arguments);
      return isPromise(res) ? res.catch(handler) : res;
    }
    catch (e) {
      handler(e);
    }
  }
}
catchErrors.handler = e => console.error(e);

export const once = (f) => {
  let called;
  return function () {
    if (called) return;
    called = true;
    return f.apply(this, arguments);
  }
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
  return throttled;
}
throttle.sync = f => {
  let locked = false;
  const throttled = function() {
    if (locked) return;
    locked = true;
    try { return f.apply(this, arguments); }
    finally { locked = false; }
  };
  throttled.isLocked = () => locked;
  return throttled;
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
  return throttled;
}

export const cached = (f, keyFn=String, map=new Map()) => {
  return function (...args) {
    const key = keyFn(...args);
    let result = map.get(key);
    if (result) return result;
    map.set(key, result = f.apply(this, args));
    return result;
  }
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

export const jitter = {
  full: delay => Math.random() * delay,
  equal: delay => delay / 2 + Math.random() * delay / 2,
  decorrelated: (_delay, prevDelay) => Math.random() * prevDelay * 3
}
export const backoff = async ({
  retries,
  delay,
  minDelay,
  maxDelay,
  jitter: _jitter,
  onError=console.error
}, func) => {
  retries = (
    typeof retries == 'number' ? retries :
    err`invalid "retries" argument`
  );

  const jitterFn = (
    _jitter == false || _jitter == null ? null :
    typeof _jitter == 'function' ? _jitter :
    _jitter in jitter ? jitter[_jitter] :
    err`invalid "jitter" argument`
  );

  const delayFn = (
    typeof delay == 'function' ? delay :
    typeof delay == 'object' ? attempt => delay.base * Math.pow(delay.factor, attempt) :
    err`invalid "delay" argument`
  );

  let lastError, prevDelayMs;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await func();
    } catch (error) {
      onError(lastError = error);
      let delayMs = delayFn(attempt);
      if (jitterFn) delayMs = jitterFn(delayMs, prevDelayMs);
      if (minDelay) delayMs = Math.max(minDelay, delayMs);
      if (maxDelay) delayMs = Math.min(maxDelay, delayMs);
      await sleep(prevDelayMs = delayMs);
    }
  }
  throw lastError;
}

//

export const isObject = value => {
  return typeof value == 'object' && value !== null;
}
export const isPlainObject = value => {
  if (value == null) return false;
  const proto = Object.getPrototypeOf(value);
  const proto2 = proto && Object.getPrototypeOf(proto);
  return proto && !proto2;
}

export const objectHasOwn = (obj, key) =>
  Object.prototype.hasOwnProperty.call(obj, key);

export const objectEntriesDeep = function* (obj) {
  const run = function* (value, keys = []) {
    if (typeof value == 'object' && value != null) {
      for (const [key, val] of Object.entries(value)) {
        yield* run(val, [...keys, key]);
      }
    }
    else {
      yield [keys, value];
    }
  }
  yield* run(obj);
}

export const objectMap = (obj, func) => {
  const res = Array.isArray(obj) ? [] : {};
  for (const [key, val] of Object.entries(obj)) {
    res[key] = func(val, key, obj);
  }
  return res;
}
export const objectMapper = (func) => (obj) => objectMap(obj, func);

const objectMapDeep_ = (obj, func, keys, root) => {
  if (!isObject(obj)) return func(obj, keys, root);
  const res = Array.isArray(obj) ? [] : {};
  for (const [key, val] of Object.entries(obj)) {
    res[key] = objectMapDeep_(val, func, [...keys, key], root);
  }
  return res;
}
export const objectMapDeep = (obj, func) => objectMapDeep_(obj, func, [], obj);
export const objectMapperDeep = (func) => (obj) => objectMapDeep(obj, func);

export const objectPick = (obj, keys) => {
  return Object.fromEntries(keys.map(k => [k, obj[k]]));
}
export const objectPicker = (keys) => {
  return (obj) => objectPick(obj, keys);
}