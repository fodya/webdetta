import { Context } from '../context/sync.js';

export const currentEffect = Context();

export class Effect {
  parent = null;
  func = null;
  reactive = false;
  children = null; // new Set()
  postponed = null; // new Set()
  oncleanup = null; // new Set()
  destroyed = false;
  constructor(parent, func, reactive) {
    this.parent = parent;
    this.func = func;
    this.reactive = reactive;
    if (this.reactive) this.handler = this.run.bind(this);
  }
  run() {
    if (this.destroyed) return;
    this.cleanup();
    if (this.parent) {
      (this.parent.children ??= new Set()).add(this);
    }
    currentEffect.run(this, this.func);
    this.postponed?.forEach(func => func());
    this.postponed?.clear();
  }
  afterRun(func) {
    this.postponed ??= new Set();
    this.postponed.add(func);
  }

  cleanup() {
    this.oncleanup?.forEach(func => func());
    this.oncleanup?.clear();
  }

  destroy() {
    this.cleanup();
    this.destroyed = true;
    this.oncleanup = null;
    this.postponed = null;
    this.children?.forEach(child => child.destroy());
    this.parent?.children?.delete(this);
  }
}

export const onCleanup = handler => {
  const effect = currentEffect();
  (effect.oncleanup ??= new Set()).add(handler);
}

export const scheduleAfterRun = handler => {
  const effect = currentEffect();
  (effect.postponed ??= new Set()).add(handler);
}

const createEffect = (func, reactive) => {
  const parentEffect = currentEffect();
  const effect = new Effect(parentEffect, func, reactive);
  effect.run();
  return effect;
}
export const effect = func => createEffect(func, true);
export const detach = func => createEffect(func, false);