import type { SyncContext } from '../../context/types/sync.d.ts';

export const currentEffect: SyncContext<Effect | undefined>;

export type SignalOptions<T> = {
  get(this: Signal<T>): T;
  set(this: Signal<T>, value: T): T;
};

export class Signal<T = unknown> {
  constructor(options: SignalOptions<T>);
  getter: () => T;
  setter: (value: T) => T;
  effects: Set<Effect> | null;
  trigger(): void;
  get(): T;
  set(value: T): T;
  accessor(): T;
  accessor(value: T): T;
}

export type EffectHandler = () => void | (() => void);

export type EffectOptions = {
  parent?: Effect | null;
  tracking?: boolean;
  readonly?: boolean;
  handler: EffectHandler;
  errorHandler?: (err: unknown) => void;
  loadingHandler?: (effect: Effect, value: boolean) => void;
};

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
  run(): void;
  handleLoading(value: boolean): void;
  handleError(err: unknown): void;
  cleanup(): void;
  destroy(): void;
}
