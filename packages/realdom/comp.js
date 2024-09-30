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

  #ctx = null
  get initialized() { return this.#ctx !== null; }
  #append(...args) {
    if (!this.initialized) throw new Error('cannot append before initialization.');
    const elm = this.elm.shadowRoot ?? this.elm;
    return this.#ctx.bindFunction(append)(elm, ...args);
  }

  init(args, ctx) {
    if (this.initialized) return;
    this.#ctx = new Ctx();
    const func = this.#ctx.bindFunction(this.#func.bind(this));
    const render = once(() => this.#append(func(...args)));
    this.#ctx.connected.on(v => v && render());
  }

  get connected() { return this.#ctx.connected(); }
  connect() { this.#ctx.connected(true); }
  disconnect() { this.#ctx.connected(false); }

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
      this.instance.connect();
    }
    disconnectedCallback() {
      this.instance.disconnect();
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
