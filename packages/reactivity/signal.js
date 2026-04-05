import { throttle } from '../common/utils.js';
import { objectHasOwn } from '../common/object.js';
import { currentEffect, scheduleAfterRun } from './effects.js';

export const SignalHandlers = () => {
  let list = null;
  const add = handler => {
    (list ??= new Set()).add(handler);
  }

  const trigger = throttle.sync(() => {
    const effect = currentEffect();
    if (effect) { // Defer side-effects
      scheduleAfterRun(trigger);
      return;
    }

    if (!list) return;
    const currList = list;
    list = null; // Remove all handlers

    for (const func of currList) {
      if (func.isLocked?.()) { // If `func` is already running, add it to the list
        add(func);
      } else { // Otherwise `func` will add itself to the list only if it calls signal()
        func();
      }
    }
  });

  return { add, trigger };
}

export const Signal = ({ handlers=SignalHandlers(), get, set }) => {
  const ctx = { silentUpdate: false };
  const { add, trigger } = handlers;
  const accessor = (...args) => {
    if (args.length === 0) {
      const effect = currentEffect();
      if (effect?.handler) add?.(effect.handler);
      return get();
    } else {
      ctx.silentUpdate = false;
      const val = set.apply(ctx, args); // setter can update `this.silentUpdate=true` to not trigger handlers
      if (!ctx.silentUpdate) trigger?.();
      return val;
    }
  }
  accessor[Signal.symbol] = true
  return accessor;
}
Signal.symbol = Symbol('Signal.symbol');
Signal.isSignal = f => f && objectHasOwn(f, Signal.symbol);