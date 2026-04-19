/**
 * Execution-control helpers: safe invocation, one-shot locks, sleeping,
 * throttling, debouncing, memoization, jitter, and retry with backoff.
 *
 * @example
 * ```js
 * import { debounce, sleep } from '@webdetta/core/execution';
 *
 * const save = debounce(300, async (value) => { await api.save(value); });
 * save('a'); save('ab'); save('abc'); // only final call runs
 * await sleep(1000);
 * ```
 *
 * @module
 */

/** Any function signature. */
export type AnyFn = (...args: any[]) => any;

/** Wraps a function so thrown errors and rejected promises are routed to `onError` instead of propagating. */
export type SafeFn = {
  <T extends AnyFn>(f: T, onError?: (err: unknown) => void): T;
  /** Default error handler used when no `onError` is provided. */
  defaultErrorHandler: (err: unknown) => void;
};
/** The {@link SafeFn} instance. */
export const safe: SafeFn;

/** Function with an `isLocked()` method that reports whether a subsequent call would be skipped. */
export type LockableFn<T extends AnyFn> = T & { isLocked(): boolean };
/** Ensures `f` runs at most once; subsequent calls return the first result and leave the lock in place. */
export function once<T extends AnyFn>(f: T): LockableFn<T>;

/** Promise-based timing helpers. */
export type SleepFn = {
  /** Resolves after `delay` milliseconds. */
  (delay: number): Promise<void>;
  /** Sleeps `delay` ms, then runs `func` and resolves with its result. */
  before<T>(delay: number, func: () => T | Promise<T>): Promise<T>;
  /** Runs `func`, then sleeps `delay` ms, then resolves with the result. */
  after<T>(delay: number, func: () => T | Promise<T>): Promise<T>;
};
/** The {@link SleepFn} instance. */
export const sleep: SleepFn;

/** Options for {@link throttle}. */
export type ThrottleOptions = { onError?: (err: unknown) => void };
/** Leading-edge throttle: runs `func` immediately, ignoring calls while the previous run is in-flight. */
export function throttle<T extends AnyFn>(
  func: T,
  options?: ThrottleOptions
): LockableFn<T>;

/** Options for {@link debounce}. */
export type DebounceOptions = { onError?: (err: unknown) => void };
/** Trailing-edge debounce: delays `func` by `delay` ms, coalescing bursts into one call. */
export function debounce<T extends AnyFn>(
  delay: number,
  func: T,
  options?: DebounceOptions
): LockableFn<(...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>>>;

/** Memoizes `f` by a key derived from its arguments. */
export function cached<T extends AnyFn>(
  f: T,
  keyFn?: (...args: Parameters<T>) => string,
  map?: Map<string, ReturnType<T>>
): T;

/** Jitter strategy: given a nominal `delay` (and previous delay), returns a randomized delay. */
export type JitterFn = (delay: number, prevDelay?: number) => number;
/** Built-in jitter strategies for {@link backoff}. */
export const jitter: {
  /** Full jitter: random value in `[0, delay]`. */
  full: JitterFn;
  /** Equal jitter: `delay/2` plus a random half. */
  equal: JitterFn;
  /** Decorrelated jitter based on the previous delay. */
  decorrelated: JitterFn;
};

/** Delay schedule for {@link backoff}: either an exponential schedule or a custom function of the attempt. */
export type BackoffDelay =
  | { base: number; factor: number }
  | ((attempt: number) => number);

/** Jitter selector for {@link backoff}: a name, a custom function, or `false`/`null` to disable. */
export type BackoffJitter = keyof typeof jitter | JitterFn | false | null;

/** Options for {@link backoff}. */
export type BackoffOptions = {
  retries: number;
  delay: BackoffDelay;
  minDelay?: number;
  maxDelay?: number;
  jitter?: BackoffJitter;
  onError?: (err: unknown) => void;
};

/** Retries `func` up to `retries` times using the configured delay and jitter strategy. */
export function backoff<T>(
  options: BackoffOptions,
  func: () => T | Promise<T>
): Promise<T>;
