const defineProperty = (instance, path, descriptor) => {
  const bound = new WeakSet();
  const bind = d => {
    if (bound.has(d)) return d;
    const res =
      typeof d == 'function' ? d.bind(instance)
      : Array.isArray(d) ? d.map(bind)
      : typeof d == 'object' ? (
          bound.add(d),
          Object.entries(d).forEach(([k, v]) => d[k] = bind(v)),
          d)
      : d;
    if (['function', 'object'].includes(typeof res))
      bound.add(res);
    return res;
  }

  let obj = instance;
  for (const k of path.slice(0, -1)) obj = (obj[k] ??= {});

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
  Object.defineProperty(obj, path.at(-1), descr);
}

export const SdkInstance = (rpcInstance, methods, entries) => {
  const instance = {};

  if (rpcInstance) defineProperty(instance, ['#internals'], {
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
