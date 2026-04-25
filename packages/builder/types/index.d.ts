/**
 * Generic builder-pattern factory that records chained property accesses and
 * calls, then replays the collected tasks against an effect function.
 *
 * @example
 * ```js
 * import { Builder } from '@webdetta/core/builder';
 *
 * const operators = {
 *   where: (rows, field, value) => rows.filter((x) => x?.[field] === value),
 *   sort: (rows, field, direction = 'asc') =>
 *     [...rows].sort((a, b) => {
 *       const av = a?.[field];
 *       const bv = b?.[field];
 *       if (av === bv) return 0;
 *       const base = av > bv ? 1 : -1;
 *       return direction === 'desc' ? -base : base;
 *     }),
 *   limit: (rows, n) => rows.slice(0, n),
 * };
 *
 * const queryDsl = Builder((tasks, rows) =>
 *   tasks.reduce((acc, step) => {
 *     const [first] = step.names;
 *     const op = operators[first];
 *     return typeof op === 'function' ? op(acc, ...step.args) : acc;
 *   }, rows)
 * );
 *
 * const result = Builder.launch(
 *   queryDsl.where('status', 'active').sort('createdAt', 'desc').limit(20),
 *   rows
 * );
 *
 * ```
 *
 * @module
 */

/** A single task recorded by a builder chain: the accessed property names and call arguments. */
export type BuilderTask = {
  names: string[];
  args: unknown[];
};

/** Effect invoked when {@link Builder.launch} is called, receiving the collected task list and forwarded arguments. */
export type BuilderEffect = (tasks: BuilderTask[], ...args: unknown[]) => unknown;

/**
 * Proxy-based builder callable. Any property access returns a new builder with
 * the name appended; any call records a task and resets the name list.
 */
export interface BuilderFn {
  (...args: unknown[]): BuilderFn;
  readonly [key: string]: BuilderFn;
}

/**
 * Creates a chainable builder proxy around an `effect` function.
 *
 * Use {@link Builder.launch} to execute the collected tasks against the effect.
 * Use {@link Builder.isBuilder} to detect a builder value.
 */
export const Builder: {
  /** Creates a new builder bound to the given effect. */
  (effect: BuilderEffect, tasks?: BuilderTask[], names?: string[]): BuilderFn;
  /** Marker symbol attached to every builder callable. */
  readonly symbol: unique symbol;
  /** Returns true if `f` is a builder produced by {@link Builder}. */
  isBuilder(f: unknown): boolean;
  /** Executes a builder: runs its effect with the collected tasks and forwarded arguments. */
  launch(f: BuilderFn, ...args: unknown[]): unknown;
};
