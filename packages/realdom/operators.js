import Builder from '../common/builder.js';
import { kebab } from '../common/dom.js';
import { callFn, unwrapFn } from '../common/utils.js';
import { r } from '../reactivity/index.js';
import { Element, Operator } from './dom.js';
import { lifecycle, createList, createIf } from './dynamic.js';

let id = 0;
const ids = new WeakMap();
const argId = arg => {
  if (typeof arg !== 'object' && typeof arg !== 'function') return arg;
  const id_ = ids.get(arg);
  return id_ ? id_ : (ids.set(arg, ++id), id);
}

const toString = args => {
  let str = '';
  for (const a of args) str += unwrapFn(a);
  return str;
}

export const textContent = Operator(false, (node, _, args) => r.effect(() => {
  node.textContent = toString(args);
}));

export const ref = Operator(true, (node, _, args) => {
  for (const func of args) func(node);
});
export const attr = Operator(false, (node, names, args) => {
  r.effect(() => {
    const value = toString(args);
    for (const name of names) node.setAttribute(name, value);
  });

  lifecycle()?.onStop?.(() => {
    for (const name of names) node.removeAttribute(name);
  });
});
export const on = Operator(true, (node, names, args) => {
  for (const name of names) for (const func of args)
    node.addEventListener(name, func);

  lifecycle()?.onStop?.(() => {
    for (const name of names) for (const func of args)
      node.removeEventListener(name, func);
  });
});
const class_ = Operator(false, (node, names, args) => {
  let value; r.effect(() => {
    value = Boolean(unwrapFn(args[0]));
    if (value) node.classList.add(...names.map(kebab));
  });

  lifecycle()?.onStop?.(() => {
    if (value) node.classList.remove(...names.map(kebab));
  });
});
export { class_ as 'class' };
export const style = Operator(false, (node, names, args) => {
  r.effect(() => {
    const value = toString(args);
    for (const name of names) node.style.setProperty(kebab(name), value);
  });

  lifecycle()?.onStop?.(() => {
    for (const name of names) node.style.removeProperty(name);
  });
});

export const prop = Operator(true, (node, names, args) => {
  r.effect(() => {
    const value = unwrapFn(args[0]);
    for (const name of names) node[name] = value;
  });

  lifecycle()?.onStop?.(() => {
    for (const name of names) delete node[name];
  });
});

export const list = (itemsFn, render) => Element('')(
  ref(root => createList(root, itemsFn, render))
);

const if_ = (condition, ...args) => Element('')(
  ref(root => createIf(root, condition, args))
);
export { if_ as 'if' };
