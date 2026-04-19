/**
 * Synchronous scoped-variable contexts.
 *
 * A {@link SyncContext} holds a value visible to any code executed inside a
 * `run()` or `bind()` call on the same call stack. Use {@link Context.Snapshot}
 * to capture the current context state and replay it elsewhere.
 *
 * @example
 * ```js
 * import { Context } from '@webdetta/core/context/sync';
 *
 * const userCtx = Context();
 * userCtx.run({ id: 42 }, () => {
 *   console.log(userCtx()); // { id: 42 }
 * });
 * ```
 *
 * @module
 */

/** Re-entrant runner that restores a snapshotted context state for the duration of `func`. */
export type SnapshotRunner = <A extends unknown[], R>(
  func: (...args: A) => R,
  ...args: A
) => R;

/** Callable that reads the current value and provides scoped setters. */
export type SyncContext<T> = {
  /** Reads the current context value. */
  (): T;
  /** Runs `func` with the context temporarily set to `data`, restoring afterwards. */
  run<A extends unknown[], R>(
    this: unknown,
    data: T,
    func: (...args: A) => R,
    ...args: A
  ): R;
  /** Returns a function that always invokes `func` with the context set to `data`. */
  bind<A extends unknown[], R>(
    data: T,
    func: (...args: A) => R
  ): (...args: A) => R;
};

/** Creates synchronous contexts and context snapshots. */
export const Context: {
  /** Creates a sync context with the given `initialValue`. */
  <T>(initialValue: T): SyncContext<T>;
  /** Creates a sync context initialized to `undefined`. */
  <T = unknown>(): SyncContext<T | undefined>;
  /** Captures the current state of all sync contexts into a replayable runner. */
  Snapshot(): SnapshotRunner;
};
