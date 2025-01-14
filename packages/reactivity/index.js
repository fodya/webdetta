import { Context } from '../common/context.js';
import { throttle, objectHasOwn } from '../common/utils.js';
export const currentHandler = Context();
export const effectsAbortSignal = Context();

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
    // The handler will print 0, then 1.
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

const SKIP = Symbol('SKIP');
export const Signal = ({ handlers=Handlers(), get, set }) => {
  const ctx = { skip: false };
  set = set.bind(ctx);
  const accessor = (...a) => {
    if (a.length === 0) {
      handlers?.add(currentHandler()?.func);
      return get();
    } else {
      ctx.skip = false;
      const val = set(...a);
      if (!ctx.skip) handlers?.trigger();
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
const DiffValue = val => Signal({
  handlers: Handlers(),
  get: () => val,
  set(v) { this.skip = val === v; return val = v; }
});

const withHandler = (func, handlerCtx) =>
  (...args) => currentHandler.run(handlerCtx, func, ...args);

const effect = func => {
  let ctx, handler, aborted;
  const wrappedFunc = withHandler(func, ctx = {
    postponed: new Set(),
    func: handler = throttle.sync(() => {
      if (aborted) return;
      const res = wrappedFunc();
      for (const func of ctx.postponed) func();
      ctx.postponed.clear();
      return res;
    })
  });
  effectsAbortSignal()?.addEventListener('abort', () => aborted = true);
  return handler();
}
const isolate = func => withHandler(func, null);
const scope = func => {
  let controller;
  const handler = () => {
    if (controller?.signal?.aborted) return;
    controller?.abort();
    controller = new AbortController();
    return effectsAbortSignal.run(controller.signal, func);
  }
  handler.abort = () => controller?.abort();
  effectsAbortSignal()?.addEventListener('abort', handler.abort);
  return handler;
}

const derive = func => {
  const value = Value();
  effect(() => value(func()));
  return value;
}
const await_ = func => {
  const value = Value();
  const update = throttle.Td(0, p => p.then(value));
  effect(() => update(func()));
  return value;
}
const proxy = target => {
  const ref = (key) => {
    const val = r.derive(() => target()?.[key]);
    return (...a) => {
      if (a.length == 0) return val();
      const t = target();
      return val(t ? (t[key] = a[0]) : a[0]);
    }
  }
  const values = {};
  const get = (_, key) => values[key] ??= ref(key);
  return new Proxy({}, { get });
}

export const r = window.r={
  val: Value,
  dval: DiffValue,
  scope: scope,
  isolate: isolate,
  effect: effect,
  derive: derive,
  await: await_,
  proxy: proxy,
}
