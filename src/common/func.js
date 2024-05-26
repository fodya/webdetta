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
