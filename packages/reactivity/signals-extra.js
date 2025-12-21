import { throttle } from '../common/utils.js';
import { SignalHandlers, Signal } from './signal.js';
import { effect } from './effects.js';

export const Value = val => Signal({
  handlers: SignalHandlers(),
  get: () => val,
  set: v => val = v
});

export const DiffValue = val => Signal({
  handlers: SignalHandlers(),
  get: () => val,
  set(v) { this.silentUpdate = val === v; return val = v; }
});

export const DeferredValue = func => {
  const value = Value();
  const update = throttle.Td(0, p => Promise.resolve(p).then(value));
  effect(() => update(func()));
  return value;
}

export const ProxyValue = target => {
  const ref = (key) => {
    const val = Value();
    return (...a) => {
      const t = typeof target === 'function' ? target() : target;
      if (a.length == 0) return (val(), t?.[key]);
      if (t) t[key] = a[0];
      return val(a[0]);
    }
  }
  const values = {};
  const get = (_, key) => values[key] ??= ref(key);
  return new Proxy({}, { get });
}

export const Memo = func => {
  const value = Value();
  effect(() => value(func()));
  return value;
}