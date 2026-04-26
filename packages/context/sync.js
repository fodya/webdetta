// @ts-self-types="./types/sync.d.ts"
class ContextNode {
  constructor(value, children) {
    this.value = value;
    this.children = children ?? [undefined, undefined];
  }
  set(id, val) {
    if (!id) return new ContextNode(val, this.children);
    const c = [...this.children];
    c[id & 1] = (c[id & 1] ?? new ContextNode()).set(id >>> 1, val);
    return new ContextNode(this.value, c);
  }
  get(id, fallback) {
    if (!id) return this.value;
    const child = this.children[id & 1];
    if (!child) return fallback;
    return child.get(id >>> 1, fallback);
  }
}

let snapshot = new ContextNode();
const runWithSnapshot = (current, func, args) => {
  const prev = snapshot;
  snapshot = current;
  try { return func(...args); }
  finally { snapshot = prev; }
};

const Snapshot = (current = snapshot) => ({
  run: (func, ...args) => runWithSnapshot(current, func, args),
  set: (ctx, data = ctx()) => Snapshot(current.set(ids.get(ctx), data)),
  get: (ctx) => current.get(ids.get(ctx))
});

let ctxId = 0;
const ids = new WeakMap();
const Context = (initialValue) => {
  const id = ++ctxId;
  const run = (data, func, ...args) => runWithSnapshot(snapshot.set(id, data), func, args);
  const ctx = () => snapshot.get(id, initialValue);
  ids.set(ctx, id);
  ctx.run = run;
  ctx.bind = (data, fn) => (...a) => run(data, fn, ...a);
  return ctx;
};

Context.Snapshot = Snapshot;
export { Context };
