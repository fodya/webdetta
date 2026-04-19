// @ts-self-types="./types/sync.d.ts"
let snapshot = [];
const Snapshot = () => {
  const values = [...snapshot];
  return function (func, ...args) {
    const prev = snapshot;
    snapshot = values;
    try { return func.apply(this, args); }
    finally { snapshot = prev; }
  };
}

let ctxId = 0;
const Context = (initialValue) => {
  const id = ctxId++;
  snapshot[id] ??= initialValue;
  const context = () => snapshot[id];

  const run = context.run = function (data, func, ...args) {
    const snap = snapshot;
    const prev = snap[id];
    snap[id] = data;
    try { return func.apply(this, args); }
    finally { snap[id] = prev; }
  };

  context.bind = (data, func) => function (...args) {
    return run.call(this, data, func, ...args);
  };

  return context;
};

Context.Snapshot = Snapshot;

export { Context }