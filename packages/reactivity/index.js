import { isPromise } from '../common/utils.js';
import { Signal, Effect, currentEffect } from './base.js';

const r = {};

// Values

r.val = val => {
  const signal = new Signal({
    get() { return val; },
    set(v) {
      val = v;
      this.trigger();
      return val;
    }
  });
  return signal.accessor;
}

r.dval = val => {
  const signal = new Signal({
    get() { return val; },
    set(v) {
      if (val !== v) {
        val = v;
        this.trigger();
      }
      return val;
    }
  });
  return signal.accessor;
}

r.computed = (func, { type=r.val, initial, resolvePromises=true }={}) => {
  const value = type(initial);
  let version = 0;

  const handleValue = (active, savedVersion, val, err) => {
    if (!active || savedVersion !== version) return;
    if (err) { void err; return; /* TODO add errorHandler */ }
    value(val);
  }

  r.effect(() => {
    const savedVersion = ++version;
    let active = true;
    r.cleanup(() => active = false);

    const res = func();
    if (resolvePromises && isPromise(res)) {
      res
        .then(val => handleValue(active, savedVersion, val, null))
        .catch(err => handleValue(active, savedVersion, null, err));
    } else {
      handleValue(active, savedVersion, res, null);
    }
  });
  return value;
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

r.effect = handler => {
  const effect = new Effect(currentEffect(), handler, true);
  effect.run();
  return effect;
};
r.untrack = handler => {
  const effect = new Effect(currentEffect(), handler, false);
  effect.run();
  return effect;
};

// Utils

r.cleanup = handler => {
  currentEffect().oncleanup.push(handler);
}

//

Object.freeze(r);
export { r };