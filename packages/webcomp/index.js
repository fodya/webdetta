import { Signal } from '../reactivity/index.js';
import { throttle } from '../common/utils.js';

export const WebComponent = (name, options, func) => {
  const shadow = options.shadow ?? { mode: 'open' };
  const attrsParsers = options.attrs;
  const attrsList = Object.keys(attrsParsers);
 
  const domConstructor = class extends HTMLElement {
    static observedAttributes = attrsList;
    constructor() {
      super();
      if (shadow) this.attachShadow(shadow);
    }
    connectedCallback() {
      this.instance.connect();
    }
    disconnectedCallback() {
      this.instance.disconnect();
    }
    attributeChangedCallback = throttle.sync((name, oldValue, newValue) => {
      const parsed = attrsParsers[name](newValue);
      this.instance.attrs[name](parsed);
    })
  };
  globalThis.customElements.define(name, domConstructor);

  const result = (...args) => createInstance(name, domConstructor, func, args);
  result.domConstructor = domConstructor;

  return result;
}

const createInstance = (name, domConstructor, func, args) => {
  const dom = document.createElement(name);
  let onConnect = null, onDisconnect = null;

  const attrs = {};
  for (const key of domConstructor.observedAttributes) {
    let value;
    attrs[key] = Signal({
      handlers: new Set(),
      get: () => value,
      set: (vv) => value = vv,
    });
  }

  const instance = {
    dom,
    attrs,
    onConnect: h => (onConnect ??= new Set()).add(h),
    onDisconnect: h => (onDisconnect ??= new Set()).add(h),
    connect: () => { onConnect?.forEach(h => h()); },
    disconnect: () => { onDisconnect?.forEach(h => h()); },
  };
  Object.defineProperty(dom, 'instance', {
    value: instance,
    writable: false,
    configurable: false
  });

  const res = func.apply(instance, args);
  if (res) (dom.shadowRoot ?? dom).appendChild(res);

  return dom;
};