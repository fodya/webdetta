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

export const catchErrors = (f, handler=catchErrors.handler) => function() {
  try {
    const res = f.apply(this, arguments);
    return isPromise(res) ? res.catch(handler) : res;
  }
  catch (e) {
    handler(e);
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
    let res; try { res = f.apply(this, arguments); }
    catch (err) { locked = false; throw err; }
    locked = false;
    return res;
  };
  throttled.isLocked = () => locked;
  return throttled;
}
throttle.T = (delay, f) => throttle(async function () {
  await sleep(delay);
  return await f.apply(this, arguments);
});
throttle.Ti = (delay, f) => throttle(async function () {
  const res = await f.apply(this, arguments);
  await sleep(delay);
  return res;
});
throttle.Td = (delay, f) => {
  let t, resolve, reject;
  return function() {
    return new Promise((rs, rj) => {
      clearTimeout(t);
      reject?.();
      [resolve, reject] = [rs, rj];
      t = setTimeout(() => resolve(f.apply(this, arguments)), delay);
    }).catch(e => e);
  }
}

export const isTemplateCall = args =>
  Array.isArray(args[0]) && Object.hasOwn(args[0], 'raw');

export const templateCallToArray = args => {
  if (!isTemplateCall(args)) return args;
  let i = 0, result = [];
  for (let part of args[0]) {
    result.push(part);
    if (++i < args.length) result.push(args[i]);
  }
  return result;
}

export const base64ToText = base64 => {
  const str = atob(base64);
  const bytes = Uint8Array.from(str, m => m.codePointAt(0));
  return new TextDecoder().decode(bytes);
}

export const textToBase64 = text => {
  const bytes = new TextEncoder().encode(text);
  const str = Array.from(bytes, b => String.fromCodePoint(b)).join("");
  return btoa(str);
}

export const objectMap = (...args) => {
  if (args.length == 1) {
    const [func] = args;
    return (obj) => objectMap(obj, func);
  }
  if (args.length == 2) {
    const [obj, func] = args;
    const res = {};
    for (const [k, v] of Object.entries(obj)) res[k] = func(v, k, obj);
    return res;
  }
}
export const objectPick = (...args) => {
  if (args.length == 1) {
    const [keys] = args;
    return (obj) => objectPick(obj, keys);
  }
  if (args.length == 2) {
    const [obj, keys] = args;
    return Object.fromEntries(keys.map(k => [k, obj[k]]));
  }
}
export const S = (...args) =>
  String.raw(...args).match(/\S+/g) ?? [];
