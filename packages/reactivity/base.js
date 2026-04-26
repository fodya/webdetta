import { Context } from '../context/sync.js';

export const currentEffect = Context();

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
}

let queue;
export class Signal {
  getter = null;
  setter = null;
  constructor({ get, set }) {
    this.getter = get.bind(this);
    this.setter = set.bind(this);
    this.trigger = this.trigger.bind(this);
    this.accessor = this.accessor.bind(this);
    Object.setPrototypeOf(this.accessor, this);
  }

  effects = new Set();

  trigger() {
    const effect = currentEffect();
    if (effect) {
      flush(this, 'effects', eff => {
        if (eff.queued || effect == eff) return;// console.warn('Reactive recursion detected');
        (queue ??= []).push(eff);
        eff.queued = true;
      });
    } else {
      flush(this, 'effects', eff => eff.run());
    }
  }

  get() {
    const effect = currentEffect();
    if (effect?.tracking) {
      (effect.signals ??= new Set()).add(this);
      (this.effects ??= new Set()).add(effect);
    }
    return this.getter();
  }

  set(...args) {
    const effect = currentEffect();
    if (!allowedToWrite(effect, this)) {
      throw new Error('Cannot write to signal in this effect scope');
    }
    return this.setter(...args);
  }

  accessor(...args) {
    if (args.length === 0) return this.get();
    return this.set(...args);
  }

  update(fn) {
    if (typeof fn !== 'function') throw new Error('Signal.update: function expected');
    new Effect({
      parent: null, tracking: false, writes: this,
      handler: () => this.set(fn(this.getter())),
    }).run();
  }
}

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
  constructor({ parent, tracking, writes, handler }) {
    this.parent = parent;
    this.handler = handler;
    this.tracking = tracking;
    this.writes = writes;
    if (parent) {
      (parent.children ??= []).push(this);
    }
  }

  run() {
    if (this.destroyed) return;

    this.cleanup();

    let err;
    try {
      const cleanup = currentEffect.run(this, this.handler);
      if (typeof cleanup == 'function') (this.cleanups ??= []).push(cleanup);
    } catch (e) {
      err = e;
    } finally {
      if (queue) {
        const q = queue; queue = null;
        for (const eff of q) eff.run();
        for (const eff of q) eff.queued = false;
      }
    }

    if (!this.signals) this.tracking = false;

    if (err) throw err;
  }

  cleanup() {
    flush(this, 'signals', signal => signal.effects?.delete(this));
    flush(this, 'cleanups', func => func());
    flush(this, 'children', child => child.cleanup());
  }

  destroy() {
    this.destroyed = true;
    this.parent = null;
    flush(this, 'signals', signal => signal.effects?.delete(this));
    flush(this, 'cleanups', func => func());
    flush(this, 'children', child => child.destroy());
  }
}