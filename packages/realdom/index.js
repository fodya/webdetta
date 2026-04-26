// @ts-self-types="./types/index.d.ts"
import { Element } from './base.js';
import { kebab } from '../common/dom.js';
import { callFn } from '../common/utils.js';
import { Operator } from './base.js';
import {
  toString,
  createIf,
  createList,
  createPick,
  createSlot,
  createDynamic,
  createLazy
} from './runtime.js';

const api = {};

api.ref = Operator((node, _, args) => {
  for (const func of args) func(node);
}, { track: false });

api.parse = (...args) => {
  const div = document.createElement('div');
  div.innerHTML = toString(...args);
  return Array.from(div.children);
};

api.append = (node, ...args) => Element.append(node, args);
api.remove = Element.remove;

api.textContent = Operator((node, _, args) => {
  node.textContent = toString(...args);
});
api.if = createIf;
api.list = createList;
api.slot = createSlot;
api.pick = createPick;
api.dynamic = createDynamic;
api.lazy = createLazy;

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
  const handlers = [];
  let options;
  for (const arg of args) {
    if (typeof arg == 'function') handlers.push(arg);
    else options = arg;
  }
  let target = node;
  let bindOptions = options;
  if (options && typeof options == 'object' && Object.hasOwn(options, 'target')) {
    const rest = { ...options };
    target = rest.target ?? node;
    delete rest.target;
    bindOptions = rest;
  }
  return { handlers, options: bindOptions, target };
};

api.on = Operator((node, names, args) => {
  const { handlers, options, target } = eventHandlers(node, args);
  for (const e of names) for (const h of handlers) {
    target.addEventListener(e, h, options);
  }
  return () => {
    for (const e of names) for (const h of handlers) {
      target.removeEventListener(e, h, options);
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
  node.classList.add(...names.map(kebab));
  return () => {
    node.classList.remove(...names.map(kebab));
  };
});

api.style = Operator((node, names, args) => {
  const value = toString(...args);
  for (const name of names) {
    node.style.setProperty(kebab(name), value);
  }
  return () => {
    for (const name of names) node.style.removeProperty(kebab(name));
  };
});

api.prop = Operator((node, names, args) => {
  const value = callFn(args[0]);
  for (const name of names) node[name] = value;
  return () => {
    for (const name of names) delete node[name];
  };
});

const namespace = ns => new Proxy(api, {
  get: (target, key) =>
    target[key] ??
    Element.bind(null, ns, kebab(key).slice(1))
});
api.NS_SVG = namespace('http://www.w3.org/2000/svg');
api.NS_MATH = namespace('http://www.w3.org/1998/Math/MathML');

export const el = namespace('http://www.w3.org/1999/xhtml');