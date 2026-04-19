/**
 * Internal helper used by `r.resource()` to drive async or sync resource
 * producers and forward their lifecycle events to handlers.
 *
 * @module
 */
import type { Effect } from './base.d.ts';

/** Lifecycle handlers invoked by {@link resolveResource}. */
export type ResourceHandlers<T> = {
  onLoading(value: boolean): void;
  onError(err: unknown): void;
  onValue(value: T): void;
};

/** Subscribes to the values/errors produced by `func`, routing them to `handlers`. */
export function resolveResource<T>(
  effect: Effect,
  func: () => T | AsyncIterable<T>,
  handlers: ResourceHandlers<T>
): { destroy(): void };
