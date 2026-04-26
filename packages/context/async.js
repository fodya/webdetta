// @ts-self-types="./types/async.d.ts"
import { AsyncLocalStorage } from 'node:async_hooks';

function AsyncContextSnapshot(native, overlays=[]) {
  const snapshot = {};
  snapshot.set = (ctx, data = ctx()) => {
    return AsyncContextSnapshot(native, [
      ...overlays,
      { ctx: ctx, value: data },
    ]);
  }
  snapshot.get = (ctx) => snapshot.run(ctx);
  snapshot.run = (func, ...args) => {
    return native(overlays.reduceRight(
      (acc, { ctx, value }) => ctx.bind(value, acc),
      () => func(...args),
    ));
  }
  return snapshot;
}

export const AsyncContext = (initialValue) => {
  const storage = new AsyncLocalStorage();

  const ctx = () => {
    const state = storage.getStore();
    return state ? state.value : initialValue;
  };

  ctx.run = function (data, func, ...args) {
    const state = { value: data };
    return storage.run(state, func, ...args);
  };

  ctx.bind = (data, func) => ctx.run.bind(null, data, func);

  return ctx;
};

AsyncContext.Snapshot = () => AsyncContextSnapshot(AsyncLocalStorage.snapshot(), []);
