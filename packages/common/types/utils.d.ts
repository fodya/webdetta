/**
 * General-purpose utilities: type guards, tagged-template helpers, function
 * wrappers, and shallow/deep object transformations.
 *
 * @module
 */

/** Tagged template helper that returns an array with the template pieces and interpolated values joined into strings. */
export function arr(strings: TemplateStringsArray, ...values: unknown[]): string[];

/** Throws an `Error` with the given message. Can be used as a tagged template for composed messages. */
export function err(strings: TemplateStringsArray, ...values: unknown[]): never;
export function err(message?: string, options?: ErrorOptions): never;

/** Type guard: non-null value of typeof `'object'`. */
export function isObject(value: unknown): value is object;
/** Type guard: plain object (created via `{}` or `Object.create(null)`). */
export function isPlainObject(value: unknown): value is Record<string, unknown>;
/** Type guard: a regular (non-async, non-generator) function. */
export function isPlainFunction(f: unknown): f is (...args: unknown[]) => unknown;
/** Type guard: an `async` function. */
export function isAsyncFunction(f: unknown): f is (...args: unknown[]) => Promise<unknown>;
/** Type guard: a generator function (declared with `function*`). */
export function isGeneratorFunction(f: unknown): f is GeneratorFunction;
/** Type guard: an async generator function (declared with `async function*`). */
export function isAsyncGeneratorFunction(f: unknown): f is AsyncGeneratorFunction;
/** Type guard: an iterable (has `Symbol.iterator`). */
export function isIterable<T = unknown>(d: unknown): d is Iterable<T>;
/** Type guard: an async iterable (has `Symbol.asyncIterator`). */
export function isAsyncIterable<T = unknown>(d: unknown): d is AsyncIterable<T>;
/** Type guard: a `Promise`-like value (has a `then` method). */
export function isPromise<T = unknown>(d: unknown): d is Promise<T>;
/** Detects when a function was invoked as a tagged template literal. */
export function isTemplateCall(args: unknown[]): args is [TemplateStringsArray, ...unknown[]];

/** If `d` is a function, calls it and returns the result; otherwise returns `d` as-is. */
export function callFn<T>(d: T | (() => T)): T;
/** Repeatedly calls `d` while it is a function, returning the first non-function value. */
export function unwrapFn(d: unknown): unknown;
/** Wraps a non-function value into a nullary function, or returns the function unchanged. */
export function toFn<T>(d: T | (() => T)): () => T;

/** Normalizes tagged-template arguments into a flat array of strings and values. */
export function templateCallToArray(args: unknown[]): unknown[];

/** Yields `[keyPath, leafValue]` pairs for every leaf in a deep object. */
export function objectEntriesDeep(obj: unknown): Generator<[string[], unknown], void, unknown>;

/** Maps over array elements or object own-enumerable values, preserving the container shape. */
export function objectMap<T, R>(
  obj: readonly T[],
  func: (val: T, key: string, obj: readonly T[]) => R
): R[];
export function objectMap<T extends object, R>(
  obj: T,
  func: <K extends keyof T & string>(val: T[K], key: K, obj: T) => R
): { [K in keyof T]: R };

/** Returns a function that applies {@link objectMap} with the given mapper. */
export function objectMapper<T, R>(
  func: (val: T, key: string, obj: unknown) => R
): (obj: unknown) => unknown;

/** Like {@link objectMap}, but recurses into nested objects and arrays. */
export function objectMapDeep(
  obj: unknown,
  func: (val: unknown, keys: string[], root: unknown) => unknown
): unknown;
/** Returns a function that applies {@link objectMapDeep} with the given mapper. */
export function objectMapperDeep(
  func: (val: unknown, keys: string[], root: unknown) => unknown
): (obj: unknown) => unknown;

/** Returns a new object containing only the listed `keys` from `obj`. */
export function objectPick<T extends object, K extends keyof T>(
  obj: T,
  keys: readonly K[]
): Pick<T, K>;
/** Returns a reusable picker function bound to `keys`. */
export function objectPicker<K extends PropertyKey>(
  keys: readonly K[]
): <T extends Record<K, unknown>>(obj: T) => Pick<T, K>;
