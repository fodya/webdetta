const AsyncFunction = (async () => {}).constructor;
export const isAsync = f => f instanceof AsyncFunction;

export const safe = f => function() {
  try {
    return isAsync(f)
      ? Promise.resolve()
          .then(() => f.apply(this, arguments))
          .catch(e => console.error(e))
      : f.apply(this, arguments);
  }
  catch (e) { console.error(e); }
}
