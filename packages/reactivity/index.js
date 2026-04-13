import { isPlainFunction, isAsyncFunction, isAsyncGeneratorFunction } from '../common/utils.js';
import { Signal, Effect, currentEffect } from './base.js';
import { resolveResource } from './resolve.js';

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

// Derived

r.computed = (func, { initial }={}) => {
  assertSyncFunction('r.computed `func`', func);
  let value = initial;
  const signal = new Signal({
    get() { return value; },
    set(v) { value = v; this.trigger(); return value; }
  });
  const effect = new Effect({
    parent: currentEffect(),
    handler: () => { value = func(); signal.trigger(); },
    tracking: true,
    readonly: true
  });
  effect.run();
  return signal.accessor;
}

r.resource = (source, func, { initial }) => {
  assertSyncFunction('r.resource `source`', source);
  assertFunction('r.resource `func`', func);

  const value = r.val(initial);
  const error = r.val(null);
  const loading = r.dval(false);

  const resourceHandlers = {
    onLoading: val => {
      loading(val);
      effect.handleLoading(val);
    },
    onError: err => {
      loading(false); value(null); error(err);
      effect.handleError(err);
    },
    onValue: val => {
      loading(false); value(val); error(null);
    }
  }

  const effect = new Effect({
    parent: currentEffect(),
    handler: () => {
      const boundFunc = func.bind(this, source());
      r.untrack(() => {
        const res = resolveResource(effect, boundFunc, resourceHandlers);
        return res.destroy
      });
    },
    tracking: true,
    readonly: true
  });
  effect.run();

  return Object.assign(value, { error, loading });
}

// Stores

const Store = (target) => {
  const refs = {};
  const ref = key => refs[key] ??= new Signal({
    get() { return currentTarget[key]; },
    set(v) { return (currentTarget[key] = v, this.trigger(), v); }
  });

  let currentTarget;
  r.effect(() => {
    currentTarget = typeof target == 'function' ? target() : target;
    for (const signal of Object.values(refs)) signal.trigger();
  });

  return { ref }
}
r.store = target => {
  const { ref } = Store(target);
  return new Proxy({}, {
    get(_, key) { return ref(key).accessor(); },
    set(_, key, val) { return ref(key).accessor(val); }
  });
}
r.proxy = target => {
  const { ref } = Store(target);
  return new Proxy({}, {
    get(_, key) { return ref(key).accessor; }
  });
}

// Effects

r.effect = (handler, { onError, readonly }={}) => {
  assertSyncFunction('r.effect `handler`', handler);
  const effect = new Effect({
    parent: currentEffect(),
    handler,
    errorHandler: onError,
    tracking: true,
    readonly: readonly
  });
  effect.run();
  return effect;
};
r.untrack = (handler, { onError, readonly }={}) => {
  assertSyncFunction('r.untrack `handler`', handler);
  const effect = new Effect({
    parent: currentEffect(),
    handler,
    errorHandler: onError,
    tracking: false,
    readonly,
  });
  effect.run();
  return effect;
};

// Utils

r.subtle = {};
r.subtle.onCleanup = handler => {
  assertSyncFunction('r.cleanup `handler`', handler);
  const effect = currentEffect();
  if (!effect) throw new Error('r.cleanup cannot be executed outside r.effect');
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