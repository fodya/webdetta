export type AsyncSnapshotRunner = <A extends unknown[], R>(
  func: (...args: A) => R,
  ...args: A
) => R;

export const Snapshot: () => AsyncSnapshotRunner;

export type AsyncContextFn<T> = {
  (): T;
  run<A extends unknown[], R>(
    this: unknown,
    data: T,
    func: (...args: A) => R,
    ...args: A
  ): R;
  bind<A extends unknown[], R>(
    data: T,
    func: (...args: A) => R
  ): (...args: A) => R;
};

export const AsyncContext: {
  <T>(initialValue: T): AsyncContextFn<T>;
  <T = unknown>(): AsyncContextFn<T | undefined>;
  Snapshot: typeof Snapshot;
};
