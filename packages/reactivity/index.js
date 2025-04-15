import { Context } from '../common/context.js';
import { debug } from '../common/debug.js';
import { throttle, objectHasOwn } from '../common/utils.js';
export const effectsAbortSignal = Context();

const currentOperation = Context();
const performOperation = (func, repeated) => {
  let aborted;
  effectsAbortSignal()?.addEventListener('abort', () => aborted = true);

  const handler = throttle.sync(debug.linkOriginalFunction(func, () => {
    if (aborted) return;
    const res = currentOperation.run(operation, func);
    const { postponedCalls } = operation;
    if (postponedCalls) {
      for (const func of postponedCalls) func();
      postponedCalls.clear();
    }
    return res;
  }));

  const operation = {
    handler: repeated ? handler : null,
    postponedCalls: null, // new Set()
  }

  return handler();
}
const effect = func => performOperation(func, true);
const detach = func => performOperation(func, false);

const Handlers = () => {
  let list = new Set();
  const add = handler => list.add(handler);
  const trigger = throttle.sync(() => {
    const operation = currentOperation();
    if (operation) { // See [Postponed side-effects of an operation]
      (operation.postponedCalls ??= new Set()).add(trigger);
      return;
    }

    const currList = list;
    list = new Set(); // See [Keeping track of Signal's handlers]

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
  const ctx = { skip: false };
  set = set.bind(ctx);
  const accessor = (...a) => {
    if (a.length === 0) {
      const operation = currentOperation();
      if (operation?.handler) handlers?.add(operation.handler);
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

const scope = func => {
  let controller;
  const handler = debug.linkOriginalFunction(func, () => {
    if (controller?.signal?.aborted) return;
    controller?.abort();
    controller = new AbortController();
    return effectsAbortSignal.run(controller.signal, func);
  });
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
  const update = throttle.Td(0, p => Promise.resolve(p).then(value));
  effect(() => update(func()));
  return value;
}
const proxy = target => {
  const ref = (key) => {
    const val = r.val();
    return (...a) => {
      const t = target();
      if (a.length == 0) return (val(), t?.[key]);
      if (t) t[key] = a[0];
      return val(a[0]);
    }
  }
  const values = {};
  const get = (_, key) => values[key] ??= ref(key);
  return new Proxy({}, { get });
}

export const r = {
  val: Value,
  dval: DiffValue,
  scope: scope,
  detach: detach,
  effect: effect,
  derive: derive,
  await: await_,
  proxy: proxy,
}

//
// ### Postponed side-effects of an operation]
//
// Inside an operation, all side-effects (`Signal.set` calls) are postponed.
// Signals values will be set upon current operation finish.
//
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
//


//
// ### Keeping track of Signal's handlers
//
// Clear all handlers upon a `Signal.set` call.
// Handlers will subscribe again upon an effect call.
// Unreachable handlers will not resubscribe.
//
// Example:
// The handler will print 0, then 1, but 2 and 3 will be ignored.
// - condition `stop` causes an early return
// - an early return prevents the handler from resubscribing to `val` signal
// - thus, setting `stop = true` stops `handler` from ever being called again
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
//
