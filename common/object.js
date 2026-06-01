import { isObject } from "./checks.js";

/**
 * @param {unknown} obj
 * @returns {Generator<[string[], unknown], void, unknown>}
 */
export const objectEntriesDeep = function* (obj) {
  const run = function* (value, keys = []) {
    if (typeof value == "object" && value != null) {
      for (const [key, val] of Object.entries(value)) {
        yield* run(val, [...keys, key]);
      }
    } else {
      yield [keys, value];
    }
  };
  yield* run(obj);
};

/**
 * @param {unknown} obj
 * @param {(val: unknown, key: string, obj: unknown) => unknown} func
 * @returns {unknown}
 */
export const objectMap = (obj, func) => {
  const res = Array.isArray(obj) ? [] : {};
  for (const [key, val] of Object.entries(obj)) {
    res[key] = func(val, key, obj);
  }
  return res;
};

/**
 * @param {(val: unknown, key: string, obj: unknown) => unknown} func
 * @returns {(obj: unknown) => unknown}
 */
export const objectMapper = (func) => (obj) => objectMap(obj, func);

const objectMapDeep_ = (obj, func, keys, root) => {
  if (!isObject(obj)) return func(obj, keys, root);
  const res = Array.isArray(obj) ? [] : {};
  for (const [key, val] of Object.entries(obj)) {
    res[key] = objectMapDeep_(val, func, [...keys, key], root);
  }
  return res;
};

/**
 * @param {unknown} obj
 * @param {(val: unknown, keys: string[], root: unknown) => unknown} func
 * @returns {unknown}
 */
export const objectMapDeep = (obj, func) => objectMapDeep_(obj, func, [], obj);

/**
 * @param {(val: unknown, keys: string[], root: unknown) => unknown} func
 * @returns {(obj: unknown) => unknown}
 */
export const objectMapperDeep = (func) => (obj) => objectMapDeep(obj, func);

/**
 * @param {Record<PropertyKey, unknown>} obj
 * @param {readonly PropertyKey[]} keys
 * @returns {Record<PropertyKey, unknown>}
 */
export const objectPick = (obj, keys) => {
  return Object.fromEntries(keys.map((k) => [k, obj[k]]));
};

/**
 * @param {readonly PropertyKey[]} keys
 * @returns {(obj: Record<PropertyKey, unknown>) => Record<PropertyKey, unknown>}
 */
export const objectPicker = (keys) => {
  return (obj) => objectPick(obj, keys);
};
