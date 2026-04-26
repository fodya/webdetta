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

/** Called when scheduling would recurse (same running effect or already queued). */
export type ReactiveCycleHandler = (eff: Effect) => void;

/** Built-in names for {@link setReactiveCycleHandler}. */
export type ReactiveCycleHandlerPreset = 'throw' | 'warn' | 'ignore';

/**
 * Controls reaction to reactive recursion: preset (`throw` / `warn` / `ignore`) or custom `(eff) => void`.
 * Default is `ignore` (skip enqueue, same as previous no-op guard).
 */
export function setReactiveCycleHandler(
  arg: ReactiveCycleHandlerPreset | ReactiveCycleHandler,
): void;

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
   * Functional update: evaluates callback and writes inside an isolated effect scope
   * (`tracking: false`, `writes: this`) so reads do not subscribe and writes are allowed.
   * Track dependencies outside {@link Signal.update} if re-run is needed.
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
};

/** Reactive computation node: runs its `handler`, tracks signal reads, and re-runs on change. */
export class Effect {
  constructor(options: EffectOptions);
  parent: Effect | null;
  handler: EffectHandler;
  tracking: boolean;
  writes: Writes | undefined;
  destroyed: boolean;
  children: Effect[] | null;
  cleanups: Array<() => void> | null;
  queued: boolean;
  signals: Set<Signal> | null;
  /** Runs the handler while tracking dependencies. */
  run(): void;
  /** Invokes registered cleanup callbacks. */
  cleanup(): void;
  /** Tears down the effect and its children. */
  destroy(): void;
}
