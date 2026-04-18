export type AnyFn = (...args: any[]) => any;

export type SafeFn = {
  <T extends AnyFn>(f: T, onError?: (err: unknown) => void): T;
  defaultErrorHandler: (err: unknown) => void;
};
export const safe: SafeFn;

export type LockableFn<T extends AnyFn> = T & { isLocked(): boolean };
export function once<T extends AnyFn>(f: T): LockableFn<T>;

export type SleepFn = {
  (delay: number): Promise<void>;
  before<T>(delay: number, func: () => T | Promise<T>): Promise<T>;
  after<T>(delay: number, func: () => T | Promise<T>): Promise<T>;
};
export const sleep: SleepFn;

export type ThrottleOptions = { onError?: (err: unknown) => void };
export function throttle<T extends AnyFn>(
  func: T,
  options?: ThrottleOptions
): LockableFn<T>;

export type DebounceOptions = { onError?: (err: unknown) => void };
export function debounce<T extends AnyFn>(
  delay: number,
  func: T,
  options?: DebounceOptions
): LockableFn<(...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>>>;

export function cached<T extends AnyFn>(
  f: T,
  keyFn?: (...args: Parameters<T>) => string,
  map?: Map<string, ReturnType<T>>
): T;

export type JitterFn = (delay: number, prevDelay?: number) => number;
export const jitter: {
  full: JitterFn;
  equal: JitterFn;
  decorrelated: JitterFn;
};

export type BackoffDelay =
  | { base: number; factor: number }
  | ((attempt: number) => number);

export type BackoffJitter = keyof typeof jitter | JitterFn | false | null;

export type BackoffOptions = {
  retries: number;
  delay: BackoffDelay;
  minDelay?: number;
  maxDelay?: number;
  jitter?: BackoffJitter;
  onError?: (err: unknown) => void;
};

export function backoff<T>(
  options: BackoffOptions,
  func: () => T | Promise<T>
): Promise<T>;
