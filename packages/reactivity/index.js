import { Context } from '../common/context.js';
import { throttle, objectHasOwn } from '../common/utils.js';
export const effectsAbortSignal = Context();

const currentEffect = Context();

const performEffect = (func, repeated) => {
  let aborted;
  effectsAbortSignal()?.addEventListener('abort', () => aborted = true);

  const handler = throttle.sync(() => {
    if (aborted) return;

    const res = currentEffect.run(effectCtx, func);
    const { postponedCalls } = effectCtx;
    if (postponedCalls) {
      for (const func of postponedCalls) func();
      postponedCalls.clear();
    }
    return res;
  });

  const effectCtx = {
    handler: repeated ? handler : null,
    postponedCalls: null, // new Set()
  }

  return handler();
}

const effect = func => performEffect(func, true);
const detach = func => performEffect(func, false);

const Handlers = () => {
  let list = new Set();
  const add = handler => list.add(handler);

  const trigger = throttle.sync(() => {
    const effectCtx = currentEffect();
    if (effectCtx) { // See [Deferred side-effects of an effect]
      (effectCtx.postponedCalls ??= new Set()).add(trigger);
      return;
    }

    const currList = list;
    list = new Set(); // See [Lifecycle of an effect]

    for (const func of currList) {
      if (func.isLocked()) {
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
      const effectCtx = currentEffect();
      if (effectCtx?.handler) handlers?.add(effectCtx.handler);
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
  const update = throttle.Td(0, p => Promise.resolve(p).then(value));
  effect(() => update(func()));
  return value;
}
const proxy = target => {
  const ref = (key) => {
    const val = Value();
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
// ### Deferred side-effects of an effect
//
// Side-effect calls are postponed until the current `effect` completes.
// This prevents intermediate state from propagating to other `effect`s,
// ensuring that dependent computations are executed with a consistent, finished state.
//
// Example:
//
// const val = r.val(0);
// r.effect(function handler1() {
//   if (val() == 0) { val(1); val(2); val(3); }
// });
//
// Prints only "3", skipping intermediate values "1" and "2"
// r.effect(function handler2() {
//   console.log(val());
// });
//


//
// ### Lifecycle of an effect
//
// Clear all handlers upon a `Signal.set` call.
// Handlers will subscribe again upon an effect call.
// Unreachable handlers will not resubscribe.
//
// Example:
// Prints 0 and 1. Stops after `stop = true`, so 2 and 3 are ignored.
//
// Notice:
// `val(3)` is ignored even after `stop = false` because
// the `handler` never resubscribed to `val` updates.
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
