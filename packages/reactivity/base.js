import { Context } from '../context/sync.js';

export const currentEffect = Context();

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
    if (!this.effects) return;
    const effects = this.effects;
    this.effects = new Set();

    const effect = currentEffect();
    for (const eff of effects) {
      if (effect) effect.queued.add(eff);
      else eff.run();
    }
  }

  get() {
    const effect = currentEffect();
    if (effect?.reactive) {
      effect.signals.add(this);
      this.effects.add(effect);
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
  children = [];
  oncleanup = [];
  queued = new Set();
  signals = new Set();
  constructor(parent, handler, reactive) {
    this.parent = parent;
    this.handler = handler;
    this.reactive = reactive;
    this.parent?.children.push(this);
  }
  run() {
    if (this.destroyed) return;
    this.cleanup();
    const result = currentEffect.run(this, this.handler);
    if (this.signals.size == 0) this.reactive = false;
    for (const effect of this.queued) effect.run();
    this.queued.clear();
    return result;
  }

  cleanup() {
    for (const signal of this.signals) signal.effects.delete(this);
    this.signals.clear();
    for (const func of this.oncleanup) func();
    this.oncleanup.length = 0;
    for (const child of this.children) child.cleanup();
    this.children.length = 0;
  }

  destroy() {
    this.destroyed = true;
    this.parent = null;

    const children = this.children;
    this.cleanup();
    if (children) for (const child of children) child.destroy();
  }
}