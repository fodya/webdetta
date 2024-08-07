const defineProperty = (instance, path, descriptor) => {
  const bind = d => typeof d == 'function' ? d.bind(instance) : d;

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
  if ('get' in descriptor) {
    const get_ = bind(get);
    descr.get = () => bind(get_());
  }
  if ('set' in descriptor) {
    const set_ = bind(set);
    descr.set = () => bind(set_());
  }
  Object.defineProperty(obj, path.at(-1), descr);
}

export const SdkInstance = (rpcInstance, methods, entries) => {
  const instance = {};

  if (rpcInstance) defineProperty(instance, ['#internals'], {
    value: rpcInstance,
    writable: false
  });

  for (const { path, rpcHandler, instanceProperty } of entries) {
    if (rpcHandler && methods) methods[rpcHandler.id] = rpcHandler.value;
    if (instanceProperty) defineProperty(instance, path, instanceProperty);
  }

  Object.preventExtensions(instance);
  return instance;
}
