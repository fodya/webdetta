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
