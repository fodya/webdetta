export const isObject = value => {
  return typeof value == 'object' && value !== null;
}
export const isPlainObject = value => {
  if (value == null) return false;
  const proto = Object.getPrototypeOf(value);
  const proto2 = proto && Object.getPrototypeOf(proto);
  return proto && !proto2;
}

export const objectHasOwn = (obj, key) =>
  Object.prototype.hasOwnProperty.call(obj, key);

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

