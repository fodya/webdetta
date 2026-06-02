/**
 * A simple reactivity library for complex UI state
 * @example ./examples/index.example.js
 * @module
 */
import { Context } from "@webdetta/context/sync";

/**
 * @typedef {import("@webdetta/context/sync").SyncContext<Effect | undefined>} CurrentEffectContext
 */

/**
 * @typedef {(eff: Effect) => void} ReactiveCycleHandler
 */

/**
 * @typedef {"throw" | "warn" | "ignore"} ReactiveCycleHandlerPreset
 */

/**
 * @template T
 * @typedef {Object} SignalOptions
 * @property {() => T} get
 * @property {(value: T) => T} set
 */

/**
 * @typedef {boolean | Signal} Writes
 */

/**
 * @typedef {() => void | (() => void)} EffectHandler
 */

/**
 * @typedef {Object} EffectOptions
 * @property {Effect | null} [parent]
 * @property {boolean} [tracking]
 * @property {Writes} [writes]
 * @property {EffectHandler} handler
 */

/** @type {CurrentEffectContext} */
export const currentEffect = Context();

const cycleHandlers = {
  throw: () => {
    throw new Error("Reactive cycle detected");
  },
  warn: () => console.warn("Reactive cycle detected"),
  ignore: null,
};
let reactiveCycleHandler = cycleHandlers.ignore;

/**
 * @param {ReactiveCycleHandlerPreset | ReactiveCycleHandler} arg
 * @returns {void}
 */
export const setReactiveCycleHandler = (arg) => {
  reactiveCycleHandler = typeof arg === "function" ? arg : cycleHandlers[arg];
};

const allowedToWrite = (effect, signal) => {
  const d = effect?.writes;
  if (d === undefined || d === true) return true;
  if (d === false) return false;
  return d === signal;
};

const flush = (obj, key, cb) => {
  const queue = obj[key];
  if (!queue) return;
  obj[key] = null;
  for (const item of queue) cb(item);
};

let queue;

/**
 * @class
 * @template T
 */
export class Signal {
  getter = null;
  setter = null;

  /**
   * @param {SignalOptions<T>} options
   */
  constructor({ get, set }) {
    this.getter = get.bind(this);
    this.setter = set.bind(this);
    this.trigger = this.trigger.bind(this);
    this.accessor = this.accessor.bind(this);
    Object.setPrototypeOf(this.accessor, this);
  }

  effects = new Set();

  /** @returns {void} */
  trigger() {
    const effect = currentEffect();
    flush(this, "effects", (eff) => {
      if (eff.queued || effect == eff) {
        reactiveCycleHandler?.(eff);
        return;
      }
      if (effect) {
        (queue ??= []).push(eff);
        eff.queued = true;
      } else {
        eff.run();
      }
    });
  }

  /** @returns {T} */
  get() {
    const effect = currentEffect();
    if (effect?.tracking) {
      (effect.signals ??= new Set()).add(this);
      (this.effects ??= new Set()).add(effect);
    }
    return this.getter();
  }

  /**
   * @param {...unknown} args
   * @returns {T}
   */
  set(...args) {
    const effect = currentEffect();
    if (!allowedToWrite(effect, this)) {
      throw new Error("Cannot write to signal in this effect scope");
    }
    return this.setter(...args);
  }

  /**
   * @param {...unknown} args
   * @returns {T}
   */
  accessor(...args) {
    if (args.length === 0) return this.get();
    return this.set(...args);
  }

  /**
   * @param {(prev: T) => T} fn
   * @returns {T}
   */
  update(fn) {
    if (typeof fn !== "function") {
      throw new Error("Signal.update: function expected");
    }
    new Effect({
      parent: null,
      tracking: false,
      writes: this,
      handler: () => this.set(fn(this.getter())),
    }).run();
  }
}

/** @class */
export class Effect {
  parent = null;
  handler = null;
  tracking = false;
  writes = undefined;
  destroyed = false;
  children = null;
  cleanups = null;
  queued = false;
  signals = null;

  /**
   * @param {EffectOptions} options
   */
  constructor({ parent, tracking, writes, handler }) {
    this.parent = parent;
    this.handler = handler;
    this.tracking = tracking;
    this.writes = writes;
    if (parent) (parent.children ??= []).push(this);
  }

  /** @returns {void} */
  run() {
    if (this.destroyed) return;

    this.cleanup();

    let err;
    try {
      const cleanup = currentEffect.run(this, this.handler);
      if (typeof cleanup == "function") (this.cleanups ??= []).push(cleanup);
    } catch (e) {
      err = e;
    } finally {
      if (queue) {
        const q = queue;
        queue = null;
        for (const eff of q) eff.run();
        for (const eff of q) eff.queued = false;
      }
    }

    if (!this.signals) this.tracking = false;

    if (err) {
      console.error(err);
      throw err;
    }
  }

  /** @returns {void} */
  cleanup() {
    flush(this, "signals", (signal) => signal.effects?.delete(this));
    flush(this, "cleanups", (func) => func());
    flush(this, "children", (child) => child.cleanup());
  }

  /** @returns {void} */
  destroy() {
    this.destroyed = true;
    this.parent = null;
    flush(this, "signals", (signal) => signal.effects?.delete(this));
    flush(this, "cleanups", (func) => func());
    flush(this, "children", (child) => child.destroy());
  }
}
