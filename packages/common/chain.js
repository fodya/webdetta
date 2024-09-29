const Chain = (...steps) => {
  let listeners;
  const on = h => (listeners ??= new Set()).add(h);
  const off = h => listeners?.delete?.(h);

  const pipeline = steps.map((f, i) => (...a) => f(pipeline[i + 1], ...a));
  const trigger = (...args) => {
    const res = pipeline[0] ? [pipeline[0](...args)] : args;
    if (listeners) for (const h of listeners) h(...res);
    return res[0];
  }

  return Object.assign(trigger, { on, off });
};
const Effect = h => (next, ...a) => (h(...a), next(...a));
Effect.defer = h => (next, ...a) => (next(...a), h(...a));

export { Chain, Effect };
