const Chain = (...steps) => {
  const listeners = new Set();
  const listen = (...hs) => (hs.forEach(h => listeners.add(h)), trigger);
  const unlisten = (...hs) => (hs.forEach(h => listeners.delete(h)), trigger);

  const handlers = new Set();
  const on = (...hs) => (hs.forEach(h => handlers.add(h)), trigger);
  const off = (...hs) => (hs.forEach(h => handlers.delete(h)), trigger);

  const pipeline = steps
    .map(f => Chain.symbol in f ? f.run : f)
    .map((f, i) => (finish, args) => {
      const next = i + 1 == steps.length
        ? finish
        : (...args) => pipeline[i + 1](finish, args);
      return f(next, ...args);
    });

  const run = (next, ...args) => {
    for (const h of listeners) h(...args);
    return pipeline[0]((...res) => {
      for (const h of handlers) h(...res);
      next?.(...res);
    }, args);
  }

  const trigger = (...args) => run(null, ...args);

  return Object.assign(trigger, {
    [Chain.symbol]: true,
    run, on, off, listen, unlisten
  });
};
Chain.symbol = Symbol('Chain.symbol');

const Val = v => Chain((next, ...args) => {
  if (args.length > 0) next(v = args[0]);
  return v;
});

const Ref = (obj, key) => Chain((next, ...args) => {
  if (args.length > 0) next(obj[key] = args[0]);
  return obj[key];
});

export { Chain, Val, Ref };
