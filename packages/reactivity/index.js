// @ts-self-types="./types/index.d.ts"
import { isPlainFunction, isAsyncFunction, isAsyncGeneratorFunction } from '../common/utils.js';
import { Signal, Effect, currentEffect, setReactiveCycleHandler } from './base.js';
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

// Debugging

r._setReactiveCycleHandler = setReactiveCycleHandler;

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
} = {}) => {
  assertSyncFunction('effect `handler`', handler);
  const parent = currentEffect();
  const effect = new Effect({
    parent: attach ? parent : null,
    handler,
    tracking: track,
    writes,
  });
  if (run) effect.run();
  return effect;
}

r.effect.explicit = (source, func, options = {}) => {
  if (source) assertSyncFunction('r.effect.explicit `source`', source);
  assertFunction('r.effect.explicit `func`', func);
  return r.effect(() => {
    const deps = source?.();
    r.untrack(() => func(deps));
  }, options);
}

r.untrack = (handler, options) => r.effect(handler, {
  ...options,
  track: false,
});
r.detach = (handler, options) => r.effect(handler, {
  track: false,
  ...options,
  attach: false,
});

// Derived

r.computed = (func, { initial }={}) => {
  assertSyncFunction('r.computed `func`', func);
  let val = initial;
  const signal = new Signal({
    get() { return val; },
    set(v) { val = v; this.trigger(); return val; }
  });
  const effect = r.effect(() => {
    val = func();
    signal.trigger();
  }, { track: true, writes: false });

  const value = signal.accessor;
  value.recompute = effect.run.bind(effect);
  return value;
}

r.task = (func, { initial } = {}) => {
  assertFunction('r.task `func`', func);

  const data = r.val(initial);
  const error = r.val(null);
  const loading = r.dval(false);

  let effect;
  const run = (...args) => new Promise((resolve, reject) => {
    effect?.destroy();
    effect = r.detach(() => {
      const task = Task(func.bind(null, ...args), {
        onLoading: val => loading(val),
        onError: err => {
          effect = null;
          reject(err);
          loading(false);
          error(err);
        },
        onValue: val => {
          effect = null;
          resolve(val);
          loading(false);
          data(val);
          error(null);
        },
      });
      return () => {
        task.destroy();
        reject?.(new DOMException('task cancelled', 'AbortError'));
      };
    });
  });

  return Object.assign(run, { data, loading, error });
}

r.resource = (source, func, { initial } = {}) => {
  if (source) assertSyncFunction('r.resource `source`', source);
  assertFunction('r.resource `func`', func);
  const task = r.task(func, { initial });
  const effect = r.effect.explicit(source, task, { writes: false });
  return Object.assign(task.data, {
    error: task.error,
    loading: task.loading,
    reload: effect.run.bind(effect),
  });
}

// Stores

const createStore = ({ target }) => {
  const refs = {};
  const ref = key => refs[key] ??= new Signal({
    get() { return currentTarget[key]; },
    set(v) {
      currentTarget[key] = v;
      this.trigger();
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
r.store = (target) => {
  const { ref } = createStore({ target });
  return new Proxy({}, {
    get(_, key) { return ref(key).accessor(); },
    set(_, key, val) { return ref(key).accessor(val); }
  });
}
r.proxy = (target) => {
  const { ref } = createStore({ target });
  return new Proxy({}, {
    get(_, key) { return ref(key).accessor; }
  });
}

// Utils

r.cleanup = handler => {
  assertSyncFunction('r.cleanup `handler`', handler);
  const effect = currentEffect();
  if (!effect) throw new Error('r.cleanup cannot be executed outside r.effect');
  (effect.cleanups ??= []).push(handler);
}

//

Object.freeze(r);
export { r };

/* draft
const status = source => {
  const effect = r.effect(source, { writes: false });
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