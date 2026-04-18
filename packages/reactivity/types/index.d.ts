export * from './base.js';
export * from './resolve.js';

import type { Effect, EffectHandler } from './base.js';

export type Accessor<T> = {
  (): T;
  (value: T): T;
};

export type ReactiveEffectOptions = {
  track?: boolean;
  attach?: boolean;
  writes?: boolean;
  run?: boolean;
  onError?: (err: unknown) => void;
};

export type ResourceOptions<T> = { initial?: T };

export type Resource<T> = Accessor<T | undefined> & {
  error: Accessor<unknown>;
  loading: Accessor<boolean>;
};

export type StoreOptions = { updateTarget?: boolean };

export type ReactiveStore<T extends object> = T;

export type ReactiveProxy<T extends object> = {
  readonly [K in keyof T]: Accessor<T[K]>;
};

export const r: {
  readonly val: <T>(value: T) => Accessor<T>;
  readonly dval: <T>(value: T) => Accessor<T>;
  readonly effect: (handler: EffectHandler, options?: ReactiveEffectOptions) => Effect;
  readonly untrack: (handler: EffectHandler, options?: Omit<ReactiveEffectOptions, 'track'>) => Effect;
  readonly computed: <T>(func: () => T, options?: { initial?: T }) => Accessor<T>;
  readonly resource: <T, S>(
    source: () => S,
    func: (this: unknown, sourceValue: S) => T | AsyncIterable<T>,
    options: ResourceOptions<T>
  ) => Resource<T>;
  readonly store: <T extends object>(target: T | (() => T), options?: StoreOptions) => ReactiveStore<T>;
  readonly proxy: <T extends object>(target: T | (() => T), options?: StoreOptions) => ReactiveProxy<T>;
  readonly onCleanup: (handler: () => void) => void;
};
