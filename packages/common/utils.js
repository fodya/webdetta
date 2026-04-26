// @ts-self-types="./types/utils.d.ts"
// Syntax sugar

export const arr = (...args) => String.raw(...args).match(/\S+/g) ?? [];

export const err = (...args) => {
  throw (
    isTemplateCall(args)
    ? new Error(String.raw(...args))
    : new Error(...args)
  );
};

// Checks

export const isObject = value => {
  return typeof value == 'object' && value !== null;
}
export const isPlainObject = value => {
  if (value == null) return false;
  const proto = Object.getPrototypeOf(value);
  const proto2 = proto && Object.getPrototypeOf(proto);
  return proto && !proto2;
}

const PlainFunction = (() => {}).constructor;
export const isPlainFunction = f => typeof f == 'function' && f.constructor == PlainFunction;

const AsyncFunction = (async () => {}).constructor;
export const isAsyncFunction = f => f instanceof AsyncFunction;

const GeneratorFunction = (function* () {}).constructor;
export const isGeneratorFunction = f => f instanceof GeneratorFunction;

const AsyncGeneratorFunction = (async function* () {}).constructor;
export const isAsyncGeneratorFunction = f => f instanceof AsyncGeneratorFunction;

export const isIterable = d => d != null && typeof d[Symbol.iterator] == 'function';

export const isAsyncIterable = d => d != null && typeof d[Symbol.asyncIterator] == 'function';

export const isPromise = d => d == Promise.resolve(d);

export const isTemplateCall = args => Array.isArray(args[0]) && Object.hasOwn(args[0], 'raw');

// Conversions

export const callFn = d => typeof d == 'function' ? d() : d;
export const unwrapFn = d => typeof d == 'function' ? unwrapFn(d()) : d;
export const toFn = d => typeof d == 'function' ? d : () => d;

export const templateCallToArray = args => {
  if (!isTemplateCall(args)) return args;
  let i = 0;
  const result = [];
  for (const part of args[0]) {
    result.push(part);
    if (++i < args.length) result.push(args[i]);
  }
  return result;
}

// Object helpers

export const objectEntriesDeep = function* (obj) {
  const run = function* (value, keys = []) {
    if (typeof value == 'object' && value != null) {
      for (const [key, val] of Object.entries(value)) {
        yield* run(val, [...keys, key]);
      }
    }
    else {
      yield [keys, value];
    }
  }
  yield* run(obj);
}

export const objectMap = (obj, func) => {
  const res = Array.isArray(obj) ? [] : {};
  for (const [key, val] of Object.entries(obj)) {
    res[key] = func(val, key, obj);
  }
  return res;
}
export const objectMapper = (func) => (obj) => objectMap(obj, func);

const objectMapDeep_ = (obj, func, keys, root) => {
  if (!isObject(obj)) return func(obj, keys, root);
  const res = Array.isArray(obj) ? [] : {};
  for (const [key, val] of Object.entries(obj)) {
    res[key] = objectMapDeep_(val, func, [...keys, key], root);
  }
  return res;
}
export const objectMapDeep = (obj, func) => objectMapDeep_(obj, func, [], obj);
export const objectMapperDeep = (func) => (obj) => objectMapDeep(obj, func);

export const objectPick = (obj, keys) => {
  return Object.fromEntries(keys.map(k => [k, obj[k]]));
}
export const objectPicker = (keys) => {
  return (obj) => objectPick(obj, keys);
}

