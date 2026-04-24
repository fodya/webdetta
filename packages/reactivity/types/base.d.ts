/**
 * Low-level reactive primitives: {@link Signal} (the reactive storage cell)
 * and {@link Effect} (the reactive computation node), plus {@link currentEffect}
 * which tracks the effect currently collecting dependencies.
 *
 * @module
 */
import type { SyncContext } from '../../context/types/sync.d.ts';

/** Sync context holding the effect currently being tracked, or `undefined`. */
export const currentEffect: SyncContext<Effect | undefined>;

/** Getter/setter pair that back a reactive {@link Signal}. */
export type SignalOptions<T> = {
  get(this: Signal<T>): T;
  set(this: Signal<T>, value: T): T;
};

/** Reactive storage cell that tracks subscribing effects and re-runs them on change. */
export class Signal<T = unknown> {
  constructor(options: SignalOptions<T>);
  /** Underlying getter. */
  getter: () => T;
  /** Underlying setter. */
  setter: (value: T) => T;
  /** Effects subscribed to this signal, or `null` if none. */
  effects: Set<Effect> | null;
  /** Queues all subscribed effects for re-execution. */
  trigger(): void;
  /** Reads the value and registers the current effect as a subscriber. */
  get(): T;
  /** Writes the value and triggers subscribed effects. */
  set(value: T): T;
  /**
   * Functional update: reads previous value via untracked getter, then {@link Signal.set}.
   * Callback and {@link Signal.set} run inside `currentEffect.run(undefined, …)` so reads in the callback
   * do not subscribe, and `trigger` does not see the outer effect (avoids self-recursion when the caller
   * also tracks this signal). Track dependencies outside {@link Signal.update} if the effect must re-run on them.
   */
  update(fn: (prev: T) => T): T;
  /** Callable form combining {@link Signal.get} and {@link Signal.set}; inherits {@link Signal.update} and {@link Signal.trigger}. */
  accessor: (() => T) & ((value: T) => T);
}

/** Handler run by an {@link Effect}; may return a cleanup function. */
export type EffectHandler = () => void | (() => void);

/**
 * Write policy while effect runs: any signal (`true` / omit), none (`false`),
 * or exactly one {@link Signal} instance (not the callable accessor).
 */
export type Writes = boolean | Signal;

/** Options accepted by the {@link Effect} constructor. */
export type EffectOptions = {
  parent?: Effect | null;
  tracking?: boolean;
  /** When a {@link Signal}, must be the cell instance, not `signal.accessor`. */
  writes?: Writes;
  handler: EffectHandler;
  errorHandler?: (err: unknown) => void;
  loadingHandler?: (effect: Effect, value: boolean) => void;
};

/** Reactive computation node: runs its `handler`, tracks signal reads, and re-runs on change. */
export class Effect {
  constructor(options: EffectOptions);
  parent: Effect | null;
  handler: EffectHandler;
  errorHandler: ((err: unknown) => void) | undefined;
  loadingHandler: ((effect: Effect, value: boolean) => void) | undefined;
  tracking: boolean;
  writes: Writes | undefined;
  destroyed: boolean;
  children: Effect[] | null;
  oncleanup: Array<() => void> | null;
  queued: Set<Effect> | null;
  signals: Set<Signal> | null;
  /** Runs the handler while tracking dependencies. */
  run(): void;
  /** Notifies the installed loading handler. */
  handleLoading(value: boolean): void;
  /** Routes `err` to the effect's error handler (or rethrows). */
  handleError(err: unknown): void;
  /** Invokes registered cleanup callbacks. */
  cleanup(): void;
  /** Tears down the effect and its children. */
  destroy(): void;
}
