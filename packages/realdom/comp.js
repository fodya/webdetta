import { safe, once, throttle } from '../common/func.js';
import { el, Element, append } from './dom.js';
import Ctx from './ctx.js';

class ComponentInstance {
  #func = null
  elm = null
  constructor(func, elm) {
    this.#func = func;
    this.elm = elm;
    Object.seal(this);
  }

  #attrsHandlers = []
  attachAttrs(obj) {
    if (!this.initialized) throw new Error('cannot attach attrs before initialization.');
    for (const [k, v] of Object.entries(obj)) {
      this.#append(el.attr[k](v));
      this.#attrsHandlers.push(obj);
    }
  }

  ctx = null
  get initialized() { return this.ctx !== null; }
  init(args) {
    if (this.initialized) return;
    this.ctx = Ctx.current().fork();
    const render = once(() => this.#append(
      this.ctx.run(this.#func, args, this)
    ));
    this.ctx.connected.on(v => v && render());
  }
  #append(...args) {
    const elm = this.elm.shadowRoot ?? this.elm;
    return this.ctx.run(append, [elm, ...args]);
  }

  onAttributeChange(name, oldValue, newValue) {
    for (const obj of this.#attrsHandlers) {
      const hook = obj[name];
      if (typeof hook != 'function') continue;
      hook(newValue);
    }
  }
}

const Component = (name, options, func) => {
  const { attrs={}, shadow } = options;
  const domConstructor = class extends HTMLElement {
    static observedAttributes = Object.keys(attrs)
    constructor() {
      super();
      if (shadow) this.attachShadow(shadow);
      Object.defineProperty(this, 'instance', {
        value: new ComponentInstance(func, this),
        writable: false,
        configurable: false
      });
    }
    connectedCallback() {
      this.instance.ctx.connected(true);
    }
    disconnectedCallback() {
      this.instance.ctx.connected(false);
    }
    attributeChangedCallback(name, oldValue, newValue) {
      const format = attrs[name];
      this.instance.onAttributeChange(name, format(oldValue), format(newValue));
    }
  };
  customElements.define(name, domConstructor);

  const result = (...args) => Element(name, {}, (elem) => {
    elem.instance.init(args);
  });
  return Object.assign(result, { domConstructor });
}

export { Component }
