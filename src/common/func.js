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

export function throttle(f) {
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
