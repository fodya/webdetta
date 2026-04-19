import type { Effect } from './base.d.ts';

export type ResourceHandlers<T> = {
  onLoading(value: boolean): void;
  onError(err: unknown): void;
  onValue(value: T): void;
};

export function resolveResource<T>(
  effect: Effect,
  func: () => T | AsyncIterable<T>,
  handlers: ResourceHandlers<T>
): { destroy(): void };
