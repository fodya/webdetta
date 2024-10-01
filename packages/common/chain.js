const Chain = (...steps) => {
  const listeners = new Set();
  const listen = (...hs) => (hs.forEach(h => listeners.add(h)), trigger);
  const unlisten = (...hs) => (hs.forEach(h => listeners.delete(h)), trigger);

  const handlers = new Set();
  const on = (...hs) => (hs.forEach(h => handlers.add(h)), trigger);
  const off = (...hs) => (hs.forEach(h => handlers.delete(h)), trigger);

  const pipeline = [
    (next, ...args) => (listeners.forEach(h => h(...args)), next(...args)),
    ...steps,
    (next, ...res) => handlers.forEach(h => h(...res))
  ].map((f, i) =>
    (...args) => f(pipeline[i + 1], ...args)
  );
  const trigger = pipeline[0];
  return Object.assign(trigger, { [symbol]: true, listen, unlisten, on, off });
};
const symbol = Symbol('Chain.symbol');
Chain.isChain = f => symbol in f;

const Val = v => Chain((next, ...args) => {
  if (args.length > 0) next(v = args[0]);
  return v;
});

const Ref = (obj, key) => Chain((next, ...args) => {
  if (args.length > 0) next(obj[key] = args[0]);
  return obj[key];
});

export { Chain, Val, Ref };
