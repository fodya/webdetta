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
    if (effect?.tracking) {
      (effect.signals ??= new Set()).add(this);
      (this.effects ??= new Set()).add(effect);
    }
    return this.getter();
  }

  set(...args) {
    const effect = currentEffect();
    if (effect?.readonly) throw new Error('Cannot write to signals in readonly scope');
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
  errorHandler = null;
  loadingHandler = null;
  tracking = false;
  readonly = false;
  initialized = false;
  destroyed = false;
  children = null;
  oncleanup = null;
  queued = null;
  signals = null;
  constructor({ parent, tracking, readonly, initialized, handler, errorHandler, loadingHandler }) {
    this.parent = parent;
    this.handler = handler;
    this.errorHandler = errorHandler;
    this.loadingHandler = loadingHandler;
    this.initialized = initialized;
    this.tracking = tracking;
    this.readonly = readonly;
    if (parent) {
      this.errorHandler ??= parent.errorHandler;
      this.readonly ||= parent.readonly;
      (parent.children ??= []).push(this);
    }
  }

  run() {
    if (this.destroyed) return;
    this.cleanup();

    let err;
    try {
      this.queued = null;
      const cleanup = currentEffect.run(this, this.handler);
      if (typeof cleanup == 'function') (this.oncleanup ??= []).push(cleanup);
      flush(this, 'queued', eff => eff.run());
    } catch (e) {
      err = e;
    } finally {
      this.queued = null;
    }

    if (!this.signals) this.tracking = false;

    if (err) this.handleError(err);
  }

  handleLoading(value) {
    if (this.loadingHandler) this.loadingHandler(this, value);
  }

  handleError(err) {
    if (this.errorHandler) this.errorHandler(err);
    else throw err;
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