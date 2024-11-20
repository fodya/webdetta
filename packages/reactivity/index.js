import { Context } from '../common/context.js';
import { throttle } from '../common/utils.js';
export const handlerCtx = Context();

const handlers = (clearOnTrigger) => {
  let list = new Set();
  const add = handler => list.add(handler);
  const trigger = (...args) => {
    const currList = list;
    if (clearOnTrigger) list = new Set(); // clear all handlers.
    // handlers will subscribe again upon an effect call.
    // unreachable handlers will not resubscribe.
    for (const handler of currList) handler(...args);
  }
  return { get list() { return list; }, add, trigger };
}

export const Signal = ({ handlers=handlers(), get, set }) => {
  const accessor = (...a) => {
    if (a.length === 0) {
      let h; if (handlers && (h = handlerCtx())) handlers.add(h);
      return get();
    } else {
      const val = set(...a);
      if (handlers) handlers.trigger(val);
      return val;
    }
  }
  accessor.handlers = handlers;
  accessor[Signal.symbol] = true
  return accessor;
}
Signal.symbol = Symbol('Signal.symbol');
Signal.isSignal = f => f && Object.hasOwn(f, Signal.symbol);

const Event = val => Signal({
  handlers: handlers(false),
  get: () => val,
  set: v => val = v
});
const Value = val => Signal({
  handlers: handlers(true),
  get: () => val,
  set: v => val = v
});
const Reference = (target, key) => Signal({
  handlers: null,
  get: () => target()[key],
  set: v => target()[key] = v
});

const effect = (func) => {
  const run = () => handlerCtx.run(run, func, []);
  return run();
}
const derive = func => {
  const value = Value();
  effect(() => value(func()));
  return value;
}

export const r = {
  val: Value,
  ref: Reference,
  derive: derive,
  effect: effect
}
