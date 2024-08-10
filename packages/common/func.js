const AsyncFunction = (async () => {}).constructor;
export const isAsync = f => f instanceof AsyncFunction;
export const isPromise = d => d == Promise.resolve(d);

export const safe = (f, errorHandler=safe.errorHandler) => function() {
  try {
    return isAsync(f)
      ? Promise.resolve()
          .then(() => f.apply(this, arguments))
          .catch(errorHandler)
      : f.apply(this, arguments);
  }
  catch (e) { errorHandler(e) }
}
safe.errorHandler = e => console.error(e);

export const lock = (lockFn, f) => {
  if (isPromise(lockFn)) {
    let locked = true;
    lockFn.then(() => { locked = false; });
    lockFn = () => locked;
  }
  return function() {
    if (lockFn()) return;
    return f.apply(this, arguments);
  }
}

export const once = (f) => {
  let called = 0;
  return lock(() => (called++ > 0), f);
}

export const sleep = t => new Promise(r => setTimeout(r, t));

const throttle_ = (before, f, after) => {
  let p = null;
  return function () {
    p ??= Promise.resolve(before)
      .then(() => f.apply(this, arguments))
      .then(res => Promise.resolve(after).then(() => res))
      .then(res => (p = null, res));
    return p;
  }
}

export const throttle = f => throttle_(null, f, null);
throttle.T = (delay, f) => throttle_(sleep(delay), f, null);
throttle.Ti = (delay, f) => throttle_(null, f, sleep(delay));

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

export const objectMap = (func, obj) => Object.fromEntries(
  Object.entries(obj).map(([k, v]) => [k, func(v, k, obj)])
);
export const objectForeach = (func, obj) =>
  Object.entries(obj).map(([k, v]) => func(v, k, obj));
