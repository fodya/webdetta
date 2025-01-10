import { Context } from '../common/context.js';
import { throttle, objectHasOwn } from '../common/utils.js';
export const currentHandler = Context();

const Handlers = () => {
  let list = new Set();
  const add = func => func && list.add(func);
  const trigger = throttle.sync(() => {
    const handler = currentHandler();
    if (handler) {
      // If some other handler is already running,
      // schedule to run current trigger after that handler finishes.

      // Example:
      // Calling val(1) in `handler1` triggers `handler2`,
      // but `handler2` will print 3, not 1.
      //
      // const val = r.val(0);
      // r.effect(function handler1() {
      //   if (val() == 0) { val(1); val(2); val(3); }
      // });
      // r.effect(function handler2() {
      //   console.log(val());
      // });

      handler.postponed.add(trigger);
      return;
    }

    const currList = list;
    list = new Set(); // clear all handlers.
    // handlers will subscribe again upon an effect call.
    // unreachable handlers will not resubscribe.

    // Example:
    // The handler will be called exactly 2 times: when val() is 0 and 1.
    // - condition `stop` causes an early return
    // - an early return causes the handler to not resubscribe to `val` signal
    // - this effectively unsubscribes the handler from its signals
    //
    // const val = r.val(0);
    // let stop;
    // r.effect(function handler() {
    //   if (stop) return;
    //   console.log('handler: ', val());
    // });
    //
    // val(1);
    // stop = true;
    // val(2);
    // stop = false;
    // val(3);

    for (const func of currList) {
      if (func.isLocked()) {
        // the `func` decorated with `throttle.sync` is already running,
        // calling it will have no effect, just resubscribe it instead.
        add(func);
      } else {
        func();
      }
    }
  });
  return { add, trigger };
}

export const Signal = ({ handlers=Handlers(), get, set }) => {
  const accessor = (...a) => {
    if (a.length === 0) {
      const handler = currentHandler();
      handlers?.add(handler?.func);
      return get();
    } else {
      const val = set(...a);
      handlers?.trigger();
      return val;
    }
  }
  accessor[Signal.symbol] = true
  return accessor;
}
Signal.symbol = Symbol('Signal.symbol');
Signal.isSignal = f => f && objectHasOwn(f, Signal.symbol);

const Value = val => Signal({
  handlers: Handlers(),
  get: () => val,
  set: v => val = v
});
const Reference = (target, key) => Signal({
  handlers: null,
  get: () => target()[key],
  set: v => target()[key] = v
});

const effect = (func) => {
  const handler = throttle.sync(() => {
    const ctx = { func: handler, postponed: new Set() };
    const res = currentHandler.run(ctx, func, []);
    for (const func of ctx.postponed) func();
    return res;
  });
  return handler();
}
const diff = (...args) => {
  const signals = args.slice(0, -1);
  const func = args.at(-1);
  const values = [];
  const changed = () => {
    let res = false;
    for (let i = 0, l = signals.length; i < l; i++) {
      const val = signals[i]();
      if (val !== values[i]) res = true;
      values[i] = val;
    }
    return res;
  }
  r.effect(() => changed() && func());
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

export const r = window.r={
  val: Value,
  ref: Reference,
  derive: derive,
  diff: diff,
  effect: effect,
  proxy: proxy,
}
