export type SnapshotRunner = <A extends unknown[], R>(
  func: (...args: A) => R,
  ...args: A
) => R;

export type SyncContext<T> = {
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

export const Context: {
  <T>(initialValue: T): SyncContext<T>;
  <T = unknown>(): SyncContext<T | undefined>;
  Snapshot(): SnapshotRunner;
};
