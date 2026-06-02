/**
 * A simple reactivity library for complex UI state
 * @example ./examples/index.example.js
 * @module
 */
import {
  isAsyncFunction,
  isAsyncGeneratorFunction,
  isPlainFunction,
} from "@webdetta/common/checks";
import {
  currentEffect,
  Effect,
  setReactiveCycleHandler,
  Signal,
} from "./base.js";
import { Task } from "./task.js";

/**
 * @typedef {import("./base.js").EffectHandler} EffectHandler
 * @typedef {import("./base.js").ReactiveCycleHandler} ReactiveCycleHandler
 * @typedef {import("./base.js").ReactiveCycleHandlerPreset} ReactiveCycleHandlerPreset
 * @typedef {import("./base.js").Writes} Writes
 */

/**
 * @template T
 * @typedef {Object} Accessor
 * @property {() => T} call
 * @property {(value: T) => T} set
 * @property {(fn: (prev: T) => T) => T} update
 * @property {() => void} trigger
 */

/**
 * @template T
 * @typedef {Accessor<T> & { refresh(): void }} ComputedAccessor
 */

/**
 * @typedef {Object} ReactiveEffectOptions
 * @property {boolean} [track]
 * @property {boolean} [attach]
 * @property {Writes} [writes]
 * @property {boolean} [run]
 */

/**
 * @template T
 * @typedef {Object} AsyncTaskOptions
 * @property {T} [initial]
 */

/**
 * @template A
 * @template R
 * @typedef {Object} ReactiveTask
 * @property {(...args: A[]) => Promise<R>} call
 * @property {Accessor<R | undefined>} data
 * @property {Accessor<boolean>} loading
 * @property {Accessor<unknown>} error
 */

/**
 * @template R
 * @typedef {Accessor<R | undefined> & {
 *   error: Accessor<unknown>;
 *   loading: Accessor<boolean>;
 *   refresh: () => Promise<R>;
 * }} ReactiveResource
 */

/**
 * @template T
 * @typedef {T} ReactiveStore
 */

/**
 * @template T
 * @typedef {{ readonly [K in keyof T]: Accessor<T[K]> }} ReactiveProxy
 */

const assertFunction = (errorPrefix, func) => {
  if (typeof func == "function") return;
  throw new Error(errorPrefix + ": function expected, got " + func);
};

const assertSyncFunction = (errorPrefix, func) => {
  assertFunction(errorPrefix, func);
  if (isPlainFunction(func)) return;
  let err;
  if (isAsyncFunction(func)) {
    err = "synchronous function expected, got async function";
  }
  if (isAsyncGeneratorFunction(func)) {
    err = "synchronous function expected, got async generator function";
  }
  if (err) throw new Error(errorPrefix + ": " + err);
};

const r = {};

// Debugging

r._setReactiveCycleHandler = setReactiveCycleHandler;

// Values

/**
 * @template T
 * @param {T} value
 * @returns {Accessor<T>}
 */
r.val = (value) => {
  const signal = new Signal({
    get() {
      return value;
    },
    set(v) {
      value = v;
      this.trigger();
      return value;
    },
  });
  return signal.accessor;
};

/**
 * @template T
 * @param {T} value
 * @returns {Accessor<T>}
 */
r.dval = (value) => {
  const signal = new Signal({
    get() {
      return value;
    },
    set(v) {
      if (value !== v) {
        value = v;
        this.trigger();
      }
      return value;
    },
  });
  return signal.accessor;
};

// Effect

/**
 * @param {EffectHandler} handler
 * @param {ReactiveEffectOptions} [options]
 * @returns {Effect}
 */
r.effect = (handler, {
  track = true,
  attach = true,
  writes = undefined,
  run = true,
} = {}) => {
  assertSyncFunction("effect `handler`", handler);
  const parent = currentEffect();
  const effect = new Effect({
    parent: attach ? parent : null,
    handler,
    tracking: track,
    writes,
  });
  if (run) effect.run();
  return effect;
};

/**
 * @template S
 * @param {() => S} source
 * @param {(sourceValue: S) => unknown} func
 * @param {ReactiveEffectOptions} [options]
 * @returns {Effect}
 */
r.effect.explicit = (source, func, options = {}) => {
  if (source) assertSyncFunction("r.effect.explicit `source`", source);
  assertFunction("r.effect.explicit `func`", func);
  return r.effect(() => {
    const deps = source?.();
    r.untrack(() => func(deps));
  }, options);
};

/**
 * @param {EffectHandler} handler
 * @param {Omit<ReactiveEffectOptions, "track">} [options]
 * @returns {Effect}
 */
r.untrack = (handler, options) =>
  r.effect(handler, { ...options, track: false });

/**
 * @param {EffectHandler} handler
 * @param {Omit<ReactiveEffectOptions, "track">} [options]
 * @returns {Effect}
 */
r.detach = (handler, options) =>
  r.effect(handler, { track: false, ...options, attach: false });

// Derived

/**
 * @template T
 * @param {() => T} func
 * @param {{ initial?: T }} [options]
 * @returns {ComputedAccessor<T>}
 */
r.computed = (func, { initial } = {}) => {
  assertSyncFunction("r.computed `func`", func);
  let val = initial;
  const signal = new Signal({
    get() {
      return val;
    },
    set(v) {
      val = v;
      this.trigger();
      return val;
    },
  });
  const effect = r.effect(() => {
    val = func();
    signal.trigger();
  }, { track: true, writes: false });

  const value = signal.accessor;
  value.refresh = effect.run.bind(effect);
  return value;
};

/**
 * @template {unknown[]} A
 * @template R
 * @param {(...args: A) => R | Promise<R> | AsyncIterable<R>} func
 * @param {AsyncTaskOptions<R>} [options]
 * @returns {ReactiveTask<A, R>}
 */
r.task = (func, { initial } = {}) => {
  assertFunction("r.task `func`", func);

  const data = r.val(initial);
  const error = r.val(null);
  const loading = r.dval(false);

  let effect;
  const run = (...args) =>
    new Promise((resolve, reject) => {
      effect?.destroy();
      effect = r.detach(() => {
        const task = Task(func.bind(null, ...args), {
          onLoading: (val) => loading(val),
          onError: (err) => {
            effect = null;
            reject(err);
            loading(false);
            error(err);
          },
          onValue: (val) => {
            effect = null;
            resolve(val);
            loading(false);
            data(val);
            error(null);
          },
        });
        return () => {
          task.destroy();
          reject?.(new DOMException("task cancelled", "AbortError"));
        };
      });
    });

  return Object.assign(run, { data, loading, error });
};

/**
 * @template S
 * @template R
 * @param {(() => S) | null} source
 * @param {(sourceValue: S) => R | Promise<R> | AsyncIterable<R>} func
 * @param {AsyncTaskOptions<R>} [options]
 * @returns {ReactiveResource<R>}
 */
r.resource = (source, func, { initial } = {}) => {
  if (source) assertSyncFunction("r.resource `source`", source);
  assertFunction("r.resource `func`", func);
  const task = r.task(func, { initial });
  const effect = r.effect.explicit(source, task, { writes: false });
  return Object.assign(task.data, {
    error: task.error,
    loading: task.loading,
    refresh: effect.run.bind(effect),
  });
};

// Stores

const createStore = ({ target }) => {
  const refs = {};
  const ref = (key) =>
    refs[key] ??= new Signal({
      get() {
        return currentTarget[key];
      },
      set(v) {
        currentTarget[key] = v;
        this.trigger();
        return v;
      },
    });

  let currentTarget;
  r.effect(() => {
    currentTarget = typeof target == "function" ? target() : target;
    for (const signal of Object.values(refs)) signal.trigger();
  });

  return { ref };
};

/**
 * @template {object} T
 * @param {T | (() => T)} target
 * @returns {ReactiveStore<T>}
 */
r.store = (target) => {
  const { ref } = createStore({ target });
  return new Proxy({}, {
    get(_, key) {
      return ref(key).accessor();
    },
    set(_, key, val) {
      return ref(key).accessor(val);
    },
  });
};

/**
 * @template {object} T
 * @param {T | (() => T)} target
 * @returns {ReactiveProxy<T>}
 */
r.proxy = (target) => {
  const { ref } = createStore({ target });
  return new Proxy({}, {
    get(_, key) {
      return ref(key).accessor;
    },
  });
};

// Utils

r.cleanup = (handler) => {
  assertSyncFunction("r.cleanup `handler`", handler);
  const effect = currentEffect();
  if (!effect) throw new Error("r.cleanup cannot be executed outside r.effect");
  (effect.cleanups ??= []).push(handler);
};

//

Object.freeze(r);

export { r };
