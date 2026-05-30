/**
 * Synchronous scoped-variable contexts.
 *
 * A {@link SyncContext} holds a value visible to any code executed inside a
 * `run()` or `bind()` call on the same call stack. Use {@link Context.Snapshot}
 * to capture the current stack into a snapshot handle, then
 * {@link ContextSnapshot#run} / {@link ContextSnapshot#set} to replay or branch.
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
 * @example Snapshot and branch
 * ```js
 * const trace = Context();
 * trace.run('outer', () => {
 *   const snap = Context.Snapshot();
 *   trace.run('inner', () => {
 *     const branched = snap.set(trace); // same as snap.set(trace, trace())
 *     snap.run(() => console.log(trace())); // 'outer'
 *     branched.run(() => console.log(trace())); // 'inner'
 *   });
 * });
 * ```
 *
 * @module
 */

/** Handle returned by {@link Context.Snapshot}: immutable frame with `run` / `set`. */
export type ContextSnapshot = {
  /** Restores this snapshot for the duration of `func`, then restores the previous stack. */
  run<A extends unknown[], R>(func: (...args: A) => R, ...args: A): R;
  /** Reads `context` value as stored in this snapshot. */
  get<T>(context: SyncContext<T>): T;
  /**
   * New snapshot with slot for `context` set to `data` (default `context()` at call time).
   * `context` must be a {@link SyncContext} from {@link Context}; other values yield undefined index.
   * Does not mutate `this`. Chainable: `snap.set(a).set(b).run(fn)`.
   */
  set<T>(context: SyncContext<T>, data?: T): ContextSnapshot;
};

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
  /** Captures the current state of all sync contexts into a {@link ContextSnapshot}. */
  Snapshot(): ContextSnapshot;
};
