/**
 * Asynchronous scoped-variable contexts that survive `await` and
 * microtask/task scheduling, backed by the runtime's `AsyncLocalStorage`.
 *
 * @example
 * ```js
 * import { AsyncContext } from '@webdetta/core/context/async';
 *
 * const reqCtx = AsyncContext('no-request');
 * await reqCtx.run('req-42', async () => {
 *   await someAsyncWork();
 *   console.log(reqCtx()); // 'req-42'
 * });
 * ```
 *
 * @example Snapshot branch (values read at each `set`)
 * ```js
 * const req = AsyncContext('a');
 * await req.run('live', async () => {
 *   const snap = AsyncContext.Snapshot();
 *   await req.run('other', async () => {
 *     await snap.set(req).run(async () => console.log(req())); // 'live'
 *   });
 * });
 * ```
 *
 * @module
 */

/**
 * Handle returned by {@link AsyncContext.Snapshot}.
 * Uses `AsyncLocalStorage.snapshot()`; `run` supports both callable snapshots (Deno)
 * and `.run(cb)` (Node).
 */
export type AsyncContextSnapshot = {
  run<A extends unknown[], R>(func: (...args: A) => R, ...args: A): R;
  /** Reads `context` value as seen by this snapshot. */
  get<T>(context: AsyncContextFn<T>): T;
  /**
   * New snapshot that will `run` nested `AsyncContext` layers with
   * `data` (default: `context()` at call time). Does not mutate `this`.
   */
  set<T>(context: AsyncContextFn<T>, data?: T): AsyncContextSnapshot;
};

/** Callable that reads the current async-context value and provides scoped setters. */
export type AsyncContextFn<T> = {
  /** Reads the current async-context value. */
  (): T;
  /** Runs `func` with the async context temporarily set to `data`. */
  run<A extends unknown[], R>(
    this: unknown,
    data: T,
    func: (...args: A) => R,
    ...args: A
  ): R;
  /** Returns a function that always invokes `func` with the async context set to `data`. */
  bind<A extends unknown[], R>(
    data: T,
    func: (...args: A) => R
  ): (...args: A) => R;
};

/** Creates async contexts and async-context snapshots. */
export const AsyncContext: {
  /** Creates an async context with the given `initialValue`. */
  <T>(initialValue: T): AsyncContextFn<T>;
  /** Creates an async context initialized to `undefined`. */
  <T = unknown>(): AsyncContextFn<T | undefined>;
  /** Captures current async-local state into an {@link AsyncContextSnapshot}. */
  Snapshot(): AsyncContextSnapshot;
};
