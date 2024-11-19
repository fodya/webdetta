import { Signal } from '../reactivity/index.js';
import { objectPick, S } from '../common/utils.js';

export const WebComponent = (name, options, func) => {
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
      this.instance.attrs[name](attrs[name](newValue), false);
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
          set: (vv, setAttr=true) => {
            v = vv;
            if (setAttr) dom.setAttribute(k, v);
            return v;
          }
        })];
      }))
    };
    Object.defineProperty(dom, 'instance', {
      value: instance,
      writable: false,
      configurable: false
    });
    const ctx = objectPick(instance, S`dom onConnect onDisconnect attrs`);
    const res = func.apply(ctx, args);
    if (res) (dom.shadowRoot ?? dom).appendChild(res);
    return dom;
  };
  return Object.assign(result, { domConstructor });
}
