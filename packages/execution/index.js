// @ts-self-types="./types/index.d.ts"
import { err, isAsyncFunction, isPromise } from "../common/utils.js";

export const safe = (f, onError=safe.defaultErrorHandler) => {
  return function () {
    try {
      const res = f.apply(this, arguments);
      return isPromise(res) ? res.catch(onError) : res;
    }
    catch (e) {
      onError(e);
    }
  }
}
safe.defaultErrorHandler = console.error;

export const once = (f) => {
  let lock;
  const wrapped = function () {
    if (lock) return;
    lock = true;
    return f.apply(this, arguments);
  }
  wrapped.isLocked = () => !!lock;
  return wrapped;
}

export const sleep = delay => new Promise(r => setTimeout(r, delay));
sleep.before = (delay, func) => sleep(delay).then(func);
sleep.after = (delay, func) => Promise.resolve(func()).then(res =>
  sleep(delay).then(() => res)
);

export const throttle = (func, { onError=console.error }={}) => {
  let lock;
  const async = isAsyncFunction(func);
  const wrapped = function () {
    if (async) return lock ??= Promise.resolve(func.apply(this, arguments))
      .catch(onError)  
      .finally(() => lock = null);

    if (lock) return;
    lock = true;
    try { return func.apply(this, arguments); }
    catch (e) { onError(e); }
    finally { lock = null; }
  }
  wrapped.isLocked = () => !!lock;
  return wrapped;
};

export const debounce = (delay, func, { onError=console.error }={}) => {
  let timeout = null, pending = null;
  let runArgs = null, runThis = null;
  const run = () => {
    try {
      pending.resolve(func.apply(runThis, runArgs));
    } catch (e) {
      pending.reject(e);
      onError(e);
    } finally {
      pending = null;
      timeout = null;
    }
  }
  const wrapped = function (...args) {
    runThis = this;
    runArgs = args;
    clearTimeout(timeout);
    pending?.reject();
    pending = Promise.withResolvers();
    timeout = setTimeout(run, delay);
    return pending.promise;
  }
  wrapped.isLocked = () => timeout !== null;
  return wrapped;
}

export const cached = (f, keyFn = String, map = new Map()) => {
  const wrapped = function (...args) {
    const key = keyFn(...args);
    if (map.has(key)) return map.get(key);
    const result = f.apply(this, args);
    map.set(key, result);
    return result;
  };
  return wrapped;
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