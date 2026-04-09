import { Context } from '../context/sync.js';

export const currentEffect = Context();

const flush = (obj, key, cb) => {
  const queue = obj[key];
  if (!queue) return;
  obj[key] = null;
  for (const item of queue) cb(item);
}

export class Signal {
  getter = null;
  setter = null;
  constructor({ get, set }) {
    this.getter = get.bind(this);
    this.setter = set.bind(this);
    this.accessor = this.accessor.bind(this);
    this.trigger = this.trigger.bind(this);
  }

  effects = new Set();

  trigger() {
    const effect = currentEffect();
    if (effect) {
      effect.queued ??= new Set();
      flush(this, 'effects', eff => effect.queued.add(eff));
    } else {
      flush(this, 'effects', eff => eff.run());
    }
  }

  get() {
    const effect = currentEffect();
    if (effect?.reactive) {
      (effect.signals ??= new Set()).add(this);
      (this.effects ??= new Set()).add(effect);
    }
    return this.getter();
  }

  set(...args) {
    return this.setter(...args);
  }

  accessor(...args) {
    if (args.length === 0) return this.get();
    else return this.set(...args);
  }
}

export class Effect {
  parent = null;
  handler = null;
  reactive = false;
  destroyed = false;
  children = null;
  oncleanup = null;
  queued = null;
  signals = null;
  constructor(parent, handler, reactive) {
    this.parent = parent;
    this.handler = handler;
    this.reactive = reactive;
    if (parent) (parent.children ??= []).push(this);
  }
  run() {
    if (this.destroyed) return;
    this.cleanup();

    let res, err;
    try {
      this.queued = null;
      res = currentEffect.run(this, this.handler);
      flush(this, 'queued', eff => eff.run());
    } catch (e) {
      this.queued = null;
      err = e;
    }
    if (!this.signals) this.reactive = false;
    if (err) { throw err; /* this.errorHandler(err); */ }
    return res;
  }

  cleanup() {
    flush(this, 'signals', signal => signal.effects?.delete(this));
    flush(this, 'oncleanup', func => func());
    flush(this, 'children', child => child.cleanup());
  }

  destroy() {
    this.destroyed = true;
    this.parent = null;
    flush(this, 'signals', signal => signal.effects?.delete(this));
    flush(this, 'oncleanup', func => func());
    flush(this, 'children', child => child.destroy());
  }
}