/**
 * @param {unknown} value
 * @returns {value is object}
 */
export const isObject = (value) => {
  return typeof value == "object" && value !== null;
};

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
export const isPlainObject = (value) => {
  if (value == null) return false;
  const proto = Object.getPrototypeOf(value);
  const proto2 = proto && Object.getPrototypeOf(proto);
  return proto && !proto2;
};

const PlainFunction = (() => {}).constructor;

/**
 * @param {unknown} f
 * @returns {f is (...args: unknown[]) => unknown}
 */
export const isPlainFunction = (f) =>
  typeof f == "function" && f.constructor == PlainFunction;

const AsyncFunction = (async () => {}).constructor;

/**
 * @param {unknown} f
 * @returns {f is (...args: unknown[]) => Promise<unknown>}
 */
export const isAsyncFunction = (f) => f instanceof AsyncFunction;

const GeneratorFunction = (function* () {}).constructor;

/**
 * @param {unknown} f
 * @returns {f is GeneratorFunction}
 */
export const isGeneratorFunction = (f) => f instanceof GeneratorFunction;

const AsyncGeneratorFunction = (async function* () {}).constructor;

/**
 * @param {unknown} f
 * @returns {f is AsyncGeneratorFunction}
 */
export const isAsyncGeneratorFunction = (f) =>
  f instanceof AsyncGeneratorFunction;

/**
 * @param {unknown} d
 * @returns {d is Iterable<unknown>}
 */
export const isIterable = (d) =>
  d != null && typeof d[Symbol.iterator] == "function";

/**
 * @param {unknown} d
 * @returns {d is AsyncIterable<unknown>}
 */
export const isAsyncIterable = (d) =>
  d != null && typeof d[Symbol.asyncIterator] == "function";

/**
 * @param {unknown} d
 * @returns {d is Promise<unknown>}
 */
export const isPromise = (d) => d == Promise.resolve(d);

/**
 * @param {unknown[]} args
 * @returns {args is [TemplateStringsArray, ...unknown[]]}
 */
export const isTemplateCall = (args) =>
  Array.isArray(args[0]) && Object.hasOwn(args[0], "raw");
