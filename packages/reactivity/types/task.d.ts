/**
 * Internal Task factory used by `r.resource()` and `r.action()` to drive
 * async or sync producers and forward their lifecycle events to handlers.
 *
 * @module
 */
import type { Effect } from './base.d.ts';

/** Lifecycle handlers invoked by a Task. */
export type TaskHandlers<T> = {
  onLoading(value: boolean): void;
  onError(err: unknown): void;
  onValue(value: T): void;
};

/** Options passed to Task. */
export type TaskOptions<T> = TaskHandlers<T> & {
  /** Optional effect to preserve reactive context during async-iterable iteration. */
  effect?: Effect;
};

/** Runs `producer` and forwards value/error/loading events until destroyed. */
export function Task<T>(
  producer: () => T | Promise<T> | AsyncIterable<T>,
  options: TaskOptions<T>
): { destroy(): void };
