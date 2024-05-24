const AsyncFunction = (async () => {}).constructor;
export const isAsync = f => f instanceof AsyncFunction;

export const safe = f => (...args) => {
  try {
    return isAsync(f)
      ? Promise.resolve().then(() => f(...args)).catch(e => console.error(e))
      : f(...args);
  }
  catch (e) { console.error(e); }
}
