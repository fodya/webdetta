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
  return (...a) => (
    p ??= Promise.resolve().then(() => p = null).then(() => f(...a))
  );
}
