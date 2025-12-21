import { throttle } from '../common/utils.js';
import { Context } from '../context/sync.js';

export const currentEffect = Context();

export class Effect {
  static RUN = Symbol('Effect.RUN');
  func = null;
  handler = null;
  #parentEffect = null;
  childEffects = null; // new Set()
  postponedCalls = null; // new Set()
  #abortHandlers = null; // new Set()
  #aborted = false;
  constructor(parentEffect, func, reactive) {
    this.#parentEffect = parentEffect;
    this.func = func;
    if (reactive) this.handler = throttle.sync(this.run.bind(this));
  }
  run() {
    this.abort(Effect.RUN);
    if (this.#aborted) return;
    if (this.#parentEffect) {
      (this.#parentEffect.childEffects ??= new Set()).add(this);
    }
    currentEffect.run(this, this.func);
    this.postponedCalls?.forEach(func => func());
    this.postponedCalls?.clear();
  }
  abort(reason) {
    this.#aborted ||= reason !== Effect.RUN;
    this.childEffects?.forEach(child => child.abort(reason));
    this.#abortHandlers?.forEach(func => func(reason));
    if (this.#aborted) {
      this.#parentEffect?.childEffects?.delete(this);
      this.#abortHandlers?.clear();
    }
  }
  get aborted() {
    return this.#aborted;
  }
  onAbort(func) {
    (this.#abortHandlers ??= new Set()).add(func);
  }
}

const createEffect = (func, reactive) => {
  const parentEffect = currentEffect();
  const effect = new Effect(parentEffect, func, reactive);
  effect.run();
  return effect;
}

export const effect = func => createEffect(func, true);
export const detach = func => createEffect(func, false);

export const onAbort = handler => currentEffect()?.onAbort(handler);