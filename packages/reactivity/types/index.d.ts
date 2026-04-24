/**
 * Reactive variables, computations and stores, inspired by SolidJS.
 *
 * The main export is {@link r}, a namespace of reactive primitives. Also
 * re-exports low-level {@link Signal}/{@link Effect} types from `./base`.
 *
 * @example
 * ```js
 * import { r } from '@webdetta/core/reactivity';
 *
 * const n = r.val(0);
 * r.effect(() => console.log('n =', n()));
 * n(1); // logs "n = 1"
 * ```
 *
 * @module
 */
export * from './base.d.ts';
export * from './task.d.ts';

import type { Effect, EffectHandler, Writes } from './base.d.ts';

/** Callable reactive value: read with no args, write with one argument. */
export type Accessor<T> = {
  (): T;
  (value: T): T;
  /** Callback runs untracked; subscribe to deps outside `update` if needed. */
  update(fn: (prev: T) => T): T;
  trigger(): void;
};

/** {@link r.computed} accessor: same as {@link Accessor} plus imperative re-run of the derivation. */
export type ComputedAccessor<T> = Accessor<T> & {
  /** Re-runs backing effect and refreshes cached value (in addition to dependency-driven updates). */
  recompute(): void;
};

/** Options for `r.effect()` and related helpers. */
export type ReactiveEffectOptions = {
  track?: boolean;
  attach?: boolean;
  writes?: Writes;
  run?: boolean;
  onError?: (err: unknown) => void;
};

/** Options for `r.resource()`. */
export type ResourceOptions<T> = { initial?: T };

/** Async-value accessor with `loading`, `error`, and imperative refresh. */
export type Resource<T> = Accessor<T | undefined> & {
  error: Accessor<unknown>;
  loading: Accessor<boolean>;
  /** Re-runs source effect and producer (same as dependency-driven refresh). */
  recompute(): void;
};

/** Imperative async task with reactive status tracking. */
export type Action<A extends unknown[], R> = {
  run: (...args: A) => Promise<R>;
  lastResult: Accessor<R | undefined>;
  loading: Accessor<boolean>;
  error: Accessor<unknown>;
};

/** Options for `r.store()` and `r.proxy()`. */
export type StoreOptions = { updateTarget?: boolean };

/** Reactive wrapper around an object; reads/writes trigger reactive updates. */
export type ReactiveStore<T extends object> = T;

/** Reactive wrapper exposing each property as a callable accessor. */
export type ReactiveProxy<T extends object> = {
  readonly [K in keyof T]: Accessor<T[K]>;
};

/** Namespace of reactive primitives. */
export const r: {
  /** Creates a reactive value with the given initial value. */
  readonly val: <T>(value: T) => Accessor<T>;
  /** Creates a reactive value that is deeply reactive for object/array content. */
  readonly dval: <T>(value: T) => Accessor<T>;
  /** Registers a reactive effect that re-runs when tracked signals change. */
  readonly effect: (handler: EffectHandler, options?: ReactiveEffectOptions) => Effect;
  /** Registers an effect that does not track reads (runs only on explicit writes). */
  readonly untrack: (handler: EffectHandler, options?: Omit<ReactiveEffectOptions, 'track'>) => Effect;
  /** Creates a derived accessor whose value is recomputed when dependencies change. */
  readonly computed: <T>(func: () => T, options?: { initial?: T }) => ComputedAccessor<T>;
  /** Creates a {@link Resource} driven by an async/iterable producer. */
  readonly resource: <T, S>(
    source: () => S,
    func: (this: unknown, sourceValue: S) => T | Promise<T> | AsyncIterable<T>,
    options?: ResourceOptions<T>
  ) => Resource<T>;
  /** Creates an imperative {@link Action} with reactive status tracking. */
  readonly action: <A extends unknown[], R>(
    func: (...args: A) => R | Promise<R>
  ) => Action<A, R>;
  /** Wraps an object in a reactive store with deep tracking. */
  readonly store: <T extends object>(target: T | (() => T), options?: StoreOptions) => ReactiveStore<T>;
  /** Like {@link r.store}, but exposes each property as an accessor. */
  readonly proxy: <T extends object>(target: T | (() => T), options?: StoreOptions) => ReactiveProxy<T>;
  /** Registers a callback to run when the surrounding effect is cleaned up. */
  readonly onCleanup: (handler: () => void) => void;
};
