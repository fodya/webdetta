/**
 * Asynchronous scoped-variable contexts that survive `await` and
 * microtask/task scheduling, backed by the runtime's `AsyncLocalStorage`.
 *
 * @example
 * ```js
 * import { AsyncContext } from '@webdetta/core/context/async';
 *
 * const reqCtx = AsyncContext();
 * await reqCtx.run({ reqId: 'abc' }, async () => {
 *   await someAsyncWork();
 *   console.log(reqCtx()); // { reqId: 'abc' }
 * });
 * ```
 *
 * @module
 */

/** Re-entrant runner that restores a snapshotted async-context state for `func`. */
export type AsyncSnapshotRunner = <A extends unknown[], R>(
  func: (...args: A) => R,
  ...args: A
) => R;

/** Captures the current state of all async contexts into a replayable runner. */
export const Snapshot: () => AsyncSnapshotRunner;

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
  /** Captures the current state of all async contexts into a replayable runner. */
  Snapshot: typeof Snapshot;
};
