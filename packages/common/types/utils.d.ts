export function arr(strings: TemplateStringsArray, ...values: unknown[]): string[];

export function err(strings: TemplateStringsArray, ...values: unknown[]): never;
export function err(message?: string, options?: ErrorOptions): never;

export function isObject(value: unknown): value is object;
export function isPlainObject(value: unknown): value is Record<string, unknown>;
export function isPlainFunction(f: unknown): f is (...args: unknown[]) => unknown;
export function isAsyncFunction(f: unknown): f is (...args: unknown[]) => Promise<unknown>;
export function isGeneratorFunction(f: unknown): f is GeneratorFunction;
export function isAsyncGeneratorFunction(f: unknown): f is AsyncGeneratorFunction;
export function isIterable<T = unknown>(d: unknown): d is Iterable<T>;
export function isAsyncIterable<T = unknown>(d: unknown): d is AsyncIterable<T>;
export function isPromise<T = unknown>(d: unknown): d is Promise<T>;
export function isTemplateCall(args: unknown[]): args is [TemplateStringsArray, ...unknown[]];

export function callFn<T>(d: T | (() => T)): T;
export function unwrapFn(d: unknown): unknown;
export function toFn<T>(d: T | (() => T)): () => T;

export function templateCallToArray(args: unknown[]): unknown[];

export function objectEntriesDeep(obj: unknown): Generator<[string[], unknown], void, unknown>;

export function objectMap<T, R>(
  obj: readonly T[],
  func: (val: T, key: string, obj: readonly T[]) => R
): R[];
export function objectMap<T extends object, R>(
  obj: T,
  func: <K extends keyof T & string>(val: T[K], key: K, obj: T) => R
): { [K in keyof T]: R };

export function objectMapper<T, R>(
  func: (val: T, key: string, obj: unknown) => R
): (obj: unknown) => unknown;

export function objectMapDeep(
  obj: unknown,
  func: (val: unknown, keys: string[], root: unknown) => unknown
): unknown;
export function objectMapperDeep(
  func: (val: unknown, keys: string[], root: unknown) => unknown
): (obj: unknown) => unknown;

export function objectPick<T extends object, K extends keyof T>(
  obj: T,
  keys: readonly K[]
): Pick<T, K>;
export function objectPicker<K extends PropertyKey>(
  keys: readonly K[]
): <T extends Record<K, unknown>>(obj: T) => Pick<T, K>;
