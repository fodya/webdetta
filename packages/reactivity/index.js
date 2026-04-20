// @ts-self-types="./types/index.d.ts"
import { isPlainFunction, isAsyncFunction, isAsyncGeneratorFunction } from '../common/utils.js';
import { Signal, Effect, currentEffect } from './base.js';
import { Task } from './task.js';

const assertFunction = (errorPrefix, func) => {
  if (typeof func == 'function') return;
  throw new Error(errorPrefix + ': function expected, got ' + func);
}

const assertSyncFunction = (errorPrefix, func) => {
  assertFunction(errorPrefix, func);
  if (isPlainFunction(func)) return;
  let err;
  if (isAsyncFunction(func)) err = 'synchronous function expected, got async function';
  if (isAsyncGeneratorFunction(func)) err = 'synchronous function expected, got async generator function';
  if (err) throw new Error(errorPrefix + ': ' + err);
}

const r = {};

// Values

r.val = value => {
  const signal = new Signal({
    get() { return value; },
    set(v) { value = v; this.trigger(); return value; }
  });
  return signal.accessor;
}

r.dval = value => {
  const signal = new Signal({
    get() { return value; },
    set(v) {
      if (value !== v) { value = v; this.trigger(); }
      return value;
    }
  });
  return signal.accessor;
}

// Effect

r.effect = (handler, {
  track = true,
  attach = true,
  writes = undefined,
  run = true,
  onError,
} = {}) => {
  assertSyncFunction('effect `handler`', handler);
  const parent = currentEffect();
  const effect = new Effect({
    parent: attach ? parent : null,
    handler,
    errorHandler: onError,
    tracking: track,
    readonly: writes === undefined ? undefined : !writes
  });
  if (run) effect.run();
  return effect;
}

r.untrack = (handler, options) => r.effect(handler, { ...options, track: false });

// Derived

r.computed = (func, { initial }={}) => {
  assertSyncFunction('r.computed `func`', func);
  let value = initial;
  const signal = new Signal({
    get() { return value; },
    set(v) { value = v; this.trigger(); return value; }
  });
  r.effect(() => {
    value = func();
    signal.trigger();
  }, { track: true, writes: false });
  return signal.accessor;
}

r.resource = (source, func, { initial } = {}) => {
  assertSyncFunction('r.resource `source`', source);
  assertFunction('r.resource `func`', func);

  const value = r.val(initial);
  const error = r.val(null);
  const loading = r.dval(false);

  /** Set after `r.effect` returns — avoids TDZ if Task reads `effect` synchronously. */
  const effectRef = { current: undefined };
  const effect = r.effect(() => {
    const sourceValue = source();
    r.untrack(() => {
      const task = Task(() => func(sourceValue), {
        effect: effectRef.current,
        onLoading: val => {
          loading(val);
          effectRef.current?.handleLoading(val);
        },
        onError: err => {
          loading(false); value(null); error(err);
          effectRef.current?.handleError(err);
        },
        onValue: val => { loading(false); value(val); error(null); },
      });
      return task.destroy;
    });
  }, { writes: false });
  effectRef.current = effect;

  return Object.assign(value, { error, loading });
}

r.action = (func) => {
  assertFunction('r.action `func`', func);

  const lastResult = r.val();
  const error = r.val(null);
  const loading = r.dval(false);
  
  let destroy = null;
  const run = (...args) => new Promise((resolve, reject) => {
    destroy?.();
    let task;
    r.untrack(() => {
      task = Task(func.bind(null, ...args), {
        onLoading: val => loading(val),
        onError: err => { loading(false); error(err); reject(err); },
        onValue: val => { loading(false); lastResult(val); error(null); resolve(val); },
      });
    }, { attach: false });
    destroy = () => {
      task.destroy();
      reject(new Error('ACTION_CANCELLED'));
    };
  });

  return { run, lastResult, loading, error };
}

// Stores

const createStore = ({ target, updateTarget=false }) => {
  const refs = {};
  const ref = key => refs[key] ??= new Signal({
    get() { return currentTarget[key]; },
    set(v) {
      currentTarget[key] = v;
      if (updateTarget) target(currentTarget);
      else this.trigger();
      return v;
    }
  });

  let currentTarget;
  r.effect(() => {
    currentTarget = typeof target == 'function' ? target() : target;
    for (const signal of Object.values(refs)) signal.trigger();
  });

  return { ref }
}
r.store = (target, { updateTarget }={}) => {
  const { ref } = createStore({ target, updateTarget });
  return new Proxy({}, {
    get(_, key) { return ref(key).accessor(); },
    set(_, key, val) { return ref(key).accessor(val); }
  });
}
r.proxy = (target, { updateTarget }={}) => {
  const { ref } = createStore({ target, updateTarget });
  return new Proxy({}, {
    get(_, key) { return ref(key).accessor; }
  });
}

// Utils

r.onCleanup = handler => {
  assertSyncFunction('r.onCleanup `handler`', handler);
  const effect = currentEffect();
  if (!effect) throw new Error('r.onCleanup cannot be executed outside r.effect');
  (effect.oncleanup ??= []).push(handler);
}

//

Object.freeze(r);
export { r };

/* draft
const status = source => {
  const effect = r.effect(source, { readonly: true });
  const value = r.computed(() => {
    eff.run();
    let loading = false;
    r.untrack(() => {
      for (const sig of effect.signals) loading ||= unwrapFn(sig.loading);
    });
    return { loading, error };
  })
  return value;
}
*/