import { Signal } from '../reactivity/index.js';

const WebComponent = (name, options, func) => {
  const { attrs={}, shadow } = options;

  const domConstructor = class extends HTMLElement {
    static observedAttributes = Object.keys(attrs)
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
    attributeChangedCallback(name, oldValue, newValue) {
      this.instance.attrs[name](format(attrs[name]));
    }
  };
  globalThis.customElements.define(name, domConstructor);

  const result = (...args) => {
    const dom = document.createElement(name);
    const onConnect = new Set();
    const onDisconnect = new Set();
    const instance = {
      dom,
      onConnect: h => onConnect.add(h),
      onDisconnect: h => onDisconnect.add(h),
      connect: () => { for (const h of onConnect) h(); },
      disconnect: () => { for (const h of onDisconnect) h(); },
      attrs: Object.fromEntries(Object.keys(attrs).map(k => {
        let v;
        return [k, Signal({
          handlers: new Set(),
          get: () => v,
          set: vv => dom.setAttribute(k, v = vv)
        })];
      }))
    };
    Object.defineProperty(dom, 'instance', {
      value: instance,
      writable: false,
      configurable: false
    });
    const res = func.apply(dom.instance, args);
    if (res) (dom.shadowRoot ?? dom).appendChild(res);
    return dom;
  };
  return Object.assign(result, { domConstructor });
}

export { WebComponent }
