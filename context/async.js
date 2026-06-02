/**
 * Scoped sync/async variables made easy
 * @example ./examples/index.example.js
 * @module
 */
import { AsyncLocalStorage } from "node:async_hooks";

/**
 * @typedef {Object} AsyncContextSnapshot
 * @property {(...args: unknown[]) => unknown} run
 * @property {<T>(context: AsyncContextFn<T>) => T} get
 * @property {<T>(context: AsyncContextFn<T>, data?: T) => AsyncContextSnapshot} set
 */

/**
 * @template T
 * @typedef {Object} AsyncContextFn
 * @property {(data: T, callback: (...args: unknown[]) => unknown, ...args: unknown[]) => unknown} run
 * @property {<A extends unknown[], R>(data: T, func: (...args: A) => R) => (...args: A) => R} bind
 */

/**
 * @param {(...args: unknown[]) => unknown} native
 * @param {Array<{ ctx: AsyncContextFn<unknown>, value: unknown }>} [overlays]
 * @returns {AsyncContextSnapshot}
 */
function AsyncContextSnapshot(native, overlays = []) {
  const snapshot = {};
  snapshot.set = (ctx, data = ctx()) => {
    return AsyncContextSnapshot(native, [
      ...overlays,
      { ctx: ctx, value: data },
    ]);
  };
  snapshot.get = (ctx) => snapshot.run(ctx);
  snapshot.run = (func, ...args) => {
    return native(overlays.reduceRight(
      (acc, { ctx, value }) => ctx.bind(value, acc),
      () => func(...args),
    ));
  };
  return snapshot;
}

/**
 * @template T
 * @param {T} [initialValue]
 * @returns {AsyncContextFn<T>}
 * @example ./examples/async-basic.example.js
 */
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

/**
 * @returns {AsyncContextSnapshot}
 * @example ./examples/async-snapshot.example.js
 */
AsyncContext.Snapshot = () =>
  AsyncContextSnapshot(AsyncLocalStorage.snapshot(), []);
