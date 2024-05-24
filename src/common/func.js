const AsyncFunction = (async () => {}).constructor;
export const isAsync = f => f instanceof AsyncFunction;

export const safe = func => function() {
  try {
    return isAsync(func)
      ? Promise.resolve()
          .then(() => f.apply(this, arguments))
          .catch(e => console.error(e))
      : f.apply(this, arguments);
  }
  catch (e) { console.error(e); }
}
