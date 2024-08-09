const AsyncFunction = (async () => {}).constructor;
export const isAsync = f => f instanceof AsyncFunction;

export const safe = f => function() {
  try {
    return isAsync(f)
      ? Promise.resolve()
          .then(() => f.apply(this, arguments))
          .catch(e => safe.errorHandler(e))
      : f.apply(this, arguments);
  }
  catch (e) { safe.errorHandler(e) }
}
safe.errorHandler = e => console.error(e);

export const lock = (promise, f) => {
  let locked = true;
  promise.then(() => { locked = false; });
  return function() {
    if (locked) return;
    return f.apply(this, arguments);
  }
}

export const sleep = t => new Promise(r => setTimeout(r, t));

export const throttle = (f) => {
  let p;
  return function () {
    p ??= Promise.resolve()
      .then(() => p = null)
      .then(() => f.apply(this, arguments));
    return p;
  }
}

throttle.T = (delay, f) => {
  let t;
  return function () {
    clearTimeout(t);
    return new Promise((resolve) => {
      t = setTimeout(() => resolve(f.apply(this, arguments)), delay);
    });
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
  const str = Array.from(bytes, (byte) =>
    String.fromCodePoint(byte),
  ).join("");
  return btoa(str);
}
