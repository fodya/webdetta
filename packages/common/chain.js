const Chain = (...steps) => {
  let listeners;
  const on = h => (listeners ??= new Set()).add(h);
  const off = h => listeners?.delete?.(h);

  const pipeline = steps
    .map(f => Chain.symbol in f ? f[Chain.symbol] : f)
    .map((f, i) => (nextChain, args) => {
      const next = i + 1 == steps.length
        ? nextChain
        : (...args) => pipeline[i + 1](nextChain, args);
      return f(next, ...args);
    });

  const run = (nextChain, ...args) => {
    const res = pipeline[0] ? [pipeline[0](nextChain, args)] : args;
    if (listeners) for (const h of listeners) h(...res);
    return res[0];
  }
  const trigger = (...args) => run((...args) => args[0], ...args);

  return Object.assign(trigger, { [Chain.symbol]: run, on, off });
};
Chain.symbol = Symbol('Chain.symbol');

const Val = v => Chain((next, ...args) => (
  args.length > 0 && (v = args[0]),
  next(v)
));

const Ref = (obj, key) => Chain((next, ...args) => (
  args.length > 0 && (obj[key] = args[0]),
  next(obj[key])
));

export { Chain, Val, Ref };
