/**
 * @module
 */
import { Context } from "@webdetta/context/sync";

/**
 * @typedef {import('./base.js').DeferredElementItem} DeferredElementItem
 * @typedef {import('./base.js').ElementItem} ElementItem
 * @typedef {import('./base.js').HookName} HookName
 * @typedef {import('./base.js').OperatorFunc} OperatorFunc
 * @typedef {import('./runtime.js').IfNode} IfNode
 * @typedef {import('./runtime.js').ListItemsSource<any>} ListItemsSource
 * @typedef {import('./runtime.js').ListKeyFn<any>} ListKeyFn
 * @typedef {import('./runtime.js').ListRenderFn<any>} ListRenderFn
 */

/**
 * @typedef {AddEventListenerOptions & { target?: EventTarget }} OnBindingOptions
 */

/**
 * @typedef {IntersectionObserverInit & { target?: Element }} IntersectionBindingOptions
 */

/**
 * @typedef {MutationObserverInit & { target?: Node }} MutationBindingOptions
 */

/**
 * @typedef {Object} ObserveNamespace
 * @property {Operator} intersection
 * @property {Operator} mutation
 */

/**
 * @typedef {(...args: ElementItem[]) => Node} TagFn
 */

/**
 * @typedef {Object} ElNamespace
 * @property {Operator} ref
 * @property {(...args: unknown[]) => Element[]} parse
 * @property {<T extends Node>(node: T, ...args: ElementItem[]) => T} append
 * @property {(node: Node) => void} remove
 * @property {(cond: unknown | (() => unknown), ...args: ElementItem[]) => IfNode} if
 * @property {typeof import('./runtime.js').createList} list
 * @property {typeof import('./runtime.js').createPick} pick
 * @property {typeof import('./runtime.js').createSlot} slot
 * @property {typeof import('./runtime.js').createDynamic} dynamic
 * @property {(fn: () => ElementItem) => ElementItem} lazy
 * @property {Operator} attr
 * @property {Operator} hook
 * @property {Operator} on
 * @property {ObserveNamespace} observe
 * @property {Operator} class
 * @property {Operator} style
 * @property {Operator} prop
 * @property {ElNamespace} NS_SVG
 * @property {ElNamespace} NS_MATH
 * @property {{ [tag: string]: TagFn }} [tag]
 */

import { Element } from "./base.js";
import { toAttributeName, toCssPropertyName } from "@webdetta/common/dom";
import { callFn } from "@webdetta/common/func";
import { Operator } from "./base.js";
import {
  createDynamic,
  createIf,
  createLazy,
  createList,
  createPick,
  createSlot,
  toString,
} from "./runtime.js";

const api = {};

api.ref = Operator((node, _, args) => {
  for (const func of args) func(node);
}, { track: false });

api.parse = (...args) => {
  const div = document.createElement("div");
  div.innerHTML = toString(...args);
  return Array.from(div.children);
};

api.append = (node, ...args) => Element.append(node, args);
api.remove = Element.remove;

api.if = createIf;
api.list = createList;
api.slot = createSlot;
api.pick = createPick;
api.dynamic = createDynamic;
api.lazy = (item) => createLazy(Context.Snapshot(), item);

api.textContent = Operator((node, _, args) => {
  node.textContent = toString(...args);
});

api.attr = Operator((node, names, args) => {
  const value = toString(...args);
  for (const name of names) node.setAttribute(name, value);
  return () => {
    for (const name of names) node.removeAttribute(name);
  };
});

api.hook = Operator((node, names, args) => {
  for (const name of names) {
    for (const arg of args) {
      Element.registerHook(node, name, arg);
    }
  }
  return () => {
    // TODO
  };
});

const eventHandlers = (node, args) => {
  let options;
  for (let i = 0; i < args.length; i++) {
    if (typeof args[i] == "object") {
      options = args[i];
      args.splice(i, 1);
      i--;
    }
  }
  let target = node;
  if (options && Object.hasOwn(options, "target")) {
    target = options.target ?? node;
    options = { ...options };
    delete options.target;
  }
  return { handlers: args, options, target };
};

api.on = Operator((node, names, args) => {
  const { handlers, options, target } = eventHandlers(node, args);
  for (const e of names) {
    for (const h of handlers) {
      target.addEventListener(e, h, options);
    }
  }
  return () => {
    for (const e of names) {
      for (const h of handlers) {
        target.removeEventListener(e, h, options);
      }
    }
  };
});

api.observe = {};
api.observe.intersection = Operator((node, _names, args) => {
  const { handlers, options, target } = eventHandlers(node, args);
  const observers = [];
  for (const handler of handlers) {
    const obs = new IntersectionObserver(handler, options);
    obs.observe(target);
    observers.push(obs);
  }
  return () => {
    for (const obs of observers) obs.disconnect();
  };
});
api.observe.mutation = Operator((node, _names, args) => {
  const { handlers, options, target } = eventHandlers(node, args);
  const observers = [];
  for (const handler of handlers) {
    const obs = new MutationObserver(handler);
    obs.observe(target, options);
    observers.push(obs);
  }
  return () => {
    for (const obs of observers) obs.disconnect();
  };
});

api.class = Operator((node, names, args) => {
  const value = Boolean(callFn(args[0]));
  if (!value) return;
  node.classList.add(...names.map(toAttributeName));
  return () => {
    node.classList.remove(...names.map(toAttributeName));
  };
});

api.style = Operator((node, names, args) => {
  const value = toString(...args);
  for (const name of names) {
    node.style.setProperty(toCssPropertyName(name), value);
  }
  return () => {
    for (const name of names) {
      node.style.removeProperty(toCssPropertyName(name));
    }
  };
});

api.prop = Operator((node, names, args) => {
  const value = callFn(args[0]);
  for (const name of names) node[name] = value;
  return () => {
    for (const name of names) delete node[name];
  };
});

const tagNameRegex = /^(?:$|[:!A-Z])/; // "" | ":" | "!" | A-Z
const namespace = (ns) =>
  new Proxy(api, {
    get: (target, key) =>
      tagNameRegex.test(key)
        ? Element.bind(null, ns, toAttributeName(key).slice(1))
        : target[key],
  });
api.NS_SVG = namespace("http://www.w3.org/2000/svg");
api.NS_MATH = namespace("http://www.w3.org/1998/Math/MathML");

/** @type {ElNamespace} */
export const el = namespace("http://www.w3.org/1999/xhtml");
/**
 * @template T
 * @param {T} [initialValue]
 * @returns {import('@webdetta/context/sync').SyncContext<T>}
 */
export { Context } from "@webdetta/context/sync";
