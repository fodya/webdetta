import { Context } from '../common/context.js';
import { throttle } from '../common/utils.js';
export const currentHandler = Context();

const handlers = (clearOnTrigger) => {
  let list = new Set();
  const add = handler => list.add(handler);
  const trigger = throttle.sync((...args) => {
    const currList = list;
    if (clearOnTrigger) list = new Set(); // clear all handlers.
    // handlers will subscribe again upon an effect call.
    // unreachable handlers will not resubscribe.
    for (const handler of currList) handler(...args);
  });
  return { get list() { return list; }, add, trigger };
}

export const Signal = ({ handlers=handlers(), get, set }) => {
  const accessor = (...a) => {
    if (a.length === 0) {
      let h; if (handlers && (h = currentHandler())) handlers.add(h);
      return get();
    } else {
      const val = set(...a);
      if (handlers) handlers.trigger(val);
      return val;
    }
  }

  accessor.default = function (value, shouldReset) {
    const curr = get();

    if (arguments.length < 2) shouldReset = !!curr;
    else if (typeof shouldReset == 'function') shouldReset = shouldReset(curr);

    if (shouldReset) set(value);
    return accessor;
  }
  accessor.handlers = handlers;
  accessor[Signal.symbol] = true
  return accessor;
}
Signal.symbol = Symbol('Signal.symbol');
Signal.isSignal = f => f && Object.hasOwn(f, Signal.symbol);

const Value = val => Signal({
  handlers: handlers(true),
  get: () => val,
  set: v => val = v
});
Value.from = thing => Signal.isSignal(thing) ? thing : Value(thing);

const Reference = (target, key) => Signal({
  handlers: null,
  get: () => target()[key],
  set: v => target()[key] = v
});

const effect = (func) => {
  const handler = throttle.sync(() => currentHandler.run(handler, func, []));
  return handler();
}
const derive = func => {
  const value = Value();
  effect(() => value(func()));
  return value;
}
const proxy = func => new Proxy({}, {
  get: (_, key) => (...a) => {
    const target = func();
    return a.length === 0 ? target[key] : (target[key] = a[0]);
  }
});

export const r = {
  val: Value,
  ref: Reference,
  derive: derive,
  effect: effect,
  proxy: proxy
}
