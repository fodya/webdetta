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
  /** Callable form combining {@link Signal.get} and {@link Signal.set}. */
  accessor(): T;
  accessor(value: T): T;
}

/** Handler run by an {@link Effect}; may return a cleanup function. */
export type EffectHandler = () => void | (() => void);

/** Options accepted by the {@link Effect} constructor. */
export type EffectOptions = {
  parent?: Effect | null;
  tracking?: boolean;
  readonly?: boolean;
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
  readonly: boolean;
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
