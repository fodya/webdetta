const defineProperty = (instance, path, descriptor) => {
  const bound = new WeakSet();
  const bind = d => {
    if (bound.has(d)) return d;
    let res = d;
    if (typeof d == 'function') {
      res = d.bind(instance);
    } else if (Array.isArray(d)) {
      bound.add(d);
      bound.add(res = d.map(bind));
    } else if (typeof d == 'object') {
      bound.add(d);
      for (const [k, v] of Object.entries(obj)) d[k] = bind(v);
    }
    return res;
  }

  let { value, get, set, writable } = descriptor;
  const descr = {
    configurable: false,
    enumerable: true
  };
  if ('value' in descriptor) {
    descr.value = bind(value);
  }
  if ('writable' in descriptor) {
    descr.writable = writable;
  }
  if (descriptor.get) {
    const get_ = bind(get);
    descr.get = () => bind(get_());
  }
  if (descriptor.set) {
    const set_ = bind(set);
    descr.set = (v) => bind(set_(v));
  }

  let obj = instance;
  for (const k of path.slice(0, -1)) obj = (obj[k] ??= {});
  Object.defineProperty(obj, path.at(-1), descr);
}

export const SdkInstance = (rpcInstance, methods, entries) => {
  const instance = {};

  if (rpcInstance) Object.defineProperty(instance, '#internals', {
    value: { state: {}, rpc: rpcInstance },
    writable: false
  });

  for (const { path, rpcHandler, instanceProperty } of entries) {
    if (rpcHandler && methods) methods[rpcHandler.id] = rpcHandler.value;
    if (instanceProperty) defineProperty(instance, path, instanceProperty);
  }

  Object.preventExtensions(instance);
  return instance;
}
