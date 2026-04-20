// @ts-self-types="./types/index.d.ts"
import { Element, Lazy } from './base.js';
import { kebab } from '../common/dom.js';
import { unwrapFn } from '../common/utils.js';
import { Context } from '../context/sync.js';
import { cached } from '../execution/index.js';
import { Operator, toString } from './base.js';
import { createIf, createList, createSlot, createDynamic } from './dynamic.js';

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

api.if = (cond, ...args) => createIf().elif(cond, args);
api.list = createList;
api.slot = createSlot;
api.dynamic = createDynamic;
api.lazy = (fn) => new Lazy(fn);

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

api.on = Operator((node, names, args) => {
  let handlers = [], options;
  for (const arg of args) {
    if (typeof arg == 'function') handlers.push(arg);
    else options = arg;
  }

  const target = options?.target ?? node;
  for (const e of names) for (const h of handlers) {
    target.addEventListener(e, h, options);
  }
  return () => {
    for (const e of names) for (const h of handlers) {
      target.removeEventListener(e, h);
    }
    options = handlers = null;
  };
});

api.class = Operator((node, names, args) => {
  const value = Boolean(unwrapFn(args[0]));
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
  const value = unwrapFn(args[0]);
  for (const name of names) node[name] = value;
  return () => {
    for (const name of names) delete node[name];
  };
});

const namespace = ns => new Proxy(api, {
  get: cached((target, key) => (
    key == '!' || key == ':' || key[0] >= 'A' && key[0] <= 'Z'
    ? Element.bind(null, ns, key[0].toLowerCase() + kebab(key.slice(1)))
    : target[key]
  ), (_, key) => key + ns)
});
api.NS_SVG = namespace('http://www.w3.org/2000/svg');
api.NS_MATH = namespace('http://www.w3.org/1998/Math/MathML');

export const el = namespace(null);
export { Context, Lazy };
