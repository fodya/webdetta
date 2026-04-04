import { kebab } from '../common/dom.js';
import { unwrapFn, templateCallToArray } from '../common/utils.js';
import { r } from '../reactivity/index.js';
import { Element, Operator } from './dom.js';
import { createDynamic, createIf, createList, createSlot, onDomAppend, onDomRemove } from './dynamic.js';

const toString = args => {
  let str = '';
  for (const a of templateCallToArray(args)) str += unwrapFn(a);
  return str;
}

export const textContent = Operator((node, _, args) => r.effect(() => {
  node.textContent = toString(args);
}));

export const ref = Operator((node, _, args) => {
  for (const func of args) func(node);
});

export const parse = (...args) => {
  const div = document.createElement('div');
  div.innerHTML = toString(args);
  return Array.from(div.children);
};

export const append = (node, ...args) => Element.append(node, args);
export const remove = (node) => Element.remove(node);

const if_ = (cond, ...args) => createIf().elif(cond, args);
export { if_ as if };

export const list = (items, render, keyFn) => createList(items, render, keyFn);
export const slot = (func) => createSlot(func);
export const dynamic = (argFn, renderFn) => createDynamic(argFn, renderFn);

export const lifecycle = Operator((node, names, args) => {
  for (const name of names) {
    if (name == 'append') for (const f of args) onDomAppend(node, f);
    if (name == 'remove') for (const f of args) onDomRemove(node, f);
  }
});

export const attr = Operator((node, names, args) => r.effect(() => {
  const value = toString(args);
  for (const name of names) node.setAttribute(name, value);
  r.onCleanup(() => {
    for (const name of names) node.removeAttribute(name);
  });
}));

export const on = Operator((node, names, args) => {
  let options;
  for (const arg of args) if (typeof arg != 'function') options = arg;
  for (const e of names) for (const f of args) {
    if (typeof f == 'function') node.addEventListener(e, f, options);
  }
  options = null;
  r.onCleanup(() => {
    for (const e of names) for (const f of args) {
      if (typeof f == 'function') node.removeEventListener(e, f);
    }
  });
});

const class_ = Operator((node, names, args) => r.effect(() => {
  const value = Boolean(unwrapFn(args[0]));
  if (!value) return;
  node.classList.add(...names.map(kebab));
  r.onCleanup(() => {
    node.classList.remove(...names.map(kebab));
  });
}));
export { class_ as class };

export const style = Operator((node, names, args) => r.effect(() => {
  const value = toString(args);
  for (const name of names) {
    node.style.setProperty(kebab(name), value);
  }
  r.onCleanup(() => {
    for (const name of names) node.style.removeProperty(kebab(name));
  });
}));

export const prop = Operator((node, names, args) => r.effect(() => {
  const value = unwrapFn(args[0]);
  for (const name of names) node[name] = value;
  r.onCleanup(() => {
    for (const name of names) delete node[name];
  });
}));
