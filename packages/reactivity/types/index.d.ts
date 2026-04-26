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
 * const query = r.val('');
 * const page = r.val(1);
 * const endpoint = r.computed(() => `/api/products?q=${query()}&page=${page()}`);
 *
 * const products = r.resource(
 *   () => endpoint(),
 *   async (url) => (await fetch(url)).json(),
 *   { initial: [] }
 * );
 *
 * r.effect(() => {
 *   history.replaceState(null, '', `#${endpoint()}`);
 *   renderProducts(products.data(), products.loading(), products.error());
 * });
 *
 * searchInput.oninput = (e) => { query(e.target.value); page(1); };
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

/** Options for `r.task` (distinct from internal `TaskOptions` in `./task.d.ts`). */
export type AsyncTaskOptions<T> = {
  initial?: T;
};

/** Async task with reactive state tracking and imperative run. */
export type ReactiveTask<A extends unknown[], R> = ((...args: A) => Promise<R>) & {
  data: Accessor<R | undefined>;
  loading: Accessor<boolean>;
  error: Accessor<unknown>;
};

/** Source-driven resource accessor with status and manual reload. */
export type ReactiveResource<S, R> = Accessor<R | undefined> & {
  error: Accessor<unknown>;
  loading: Accessor<boolean>;
  reload: () => Promise<R>;
};

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
  readonly effect: ((handler: EffectHandler, options?: ReactiveEffectOptions) => Effect) & {
    /** Runs `func(source())` when deps change; `func` runs untracked. */
    explicit: <S>(
      source: () => S,
      func: (sourceValue: S) => unknown,
      options?: ReactiveEffectOptions
    ) => Effect;
  };
  /** Registers an effect that does not track reads (runs only on explicit writes). */
  readonly untrack: (handler: EffectHandler, options?: Omit<ReactiveEffectOptions, 'track'>) => Effect;
  /** Creates a derived accessor whose value is recomputed when dependencies change. */
  readonly computed: <T>(func: () => T, options?: { initial?: T }) => ComputedAccessor<T>;
  /** Creates a reactive async task with explicit `run(...)`. */
  readonly task: <A extends unknown[], R>(
    func: (...args: A) => R | Promise<R> | AsyncIterable<R>,
    options?: AsyncTaskOptions<R>
  ) => ReactiveTask<A, R>;
  /** Creates async resource accessor with `reload()` (source accessor or `null`). */
  readonly resource: {
    <R>(
      source: null,
      func: () => R | Promise<R> | AsyncIterable<R>,
      options?: AsyncTaskOptions<R>
    ): ReactiveResource<null, R>;
    <S, R>(
      source: () => S,
      func: (sourceValue: S) => R | Promise<R> | AsyncIterable<R>,
      options?: AsyncTaskOptions<R>
    ): ReactiveResource<S, R>;
  };
  /** Wraps an object in a reactive store with deep tracking. */
  readonly store: <T extends object>(target: T | (() => T)) => ReactiveStore<T>;
  /** Like {@link r.store}, but exposes each property as an accessor. */
  readonly proxy: <T extends object>(target: T | (() => T)) => ReactiveProxy<T>;
  /** Registers a callback to run when the surrounding effect is cleaned up. */
  readonly onCleanup: (handler: () => void) => void;
};
