import { kebab } from '../common/dom.js';
import { unwrapFn, templateCallToArray } from '../common/utils.js';
import { r } from '../reactivity/index.js';
import { Element, Operator } from './dom.js';
import {
  createIf, createList, createDynamicFragment,
  onOperatorDisable, domAppend, domRemove
} from './dynamic.js';

const toString = args => {
  let str = '';
  for (const a of templateCallToArray(args)) str += unwrapFn(a);
  return str;
}

export const recurrent = (func) => {
  let stopped;
  r.effect(() => (!stopped) && func());
  onOperatorDisable(() => { stopped = true; });
}

export const textContent = Operator((node, _, args) => r.effect(() => {
  node.textContent = toString(args);
}));

const ref = Operator((node, _, args) => {
  for (const func of args) func(node);
});

const parse = (...args) => {
  const div = document.createElement('div');
  div.innerHTML = toString(args);
  return Array.from(div.children);
}

export const operators = {
  parse: parse,
  append: (node, ...args) => Element.append(node, args),
  remove: (node) => Element.remove(node),
  ref: ref,

  if: (cond, ...args) => createIf().elif(cond, args),
  list: (items, render, keyFn) => createList(items, render, keyFn),
  dynamicfragment: (func) => createDynamicFragment(func),

  lifecycle: Operator((node, names, args) => {
    for (const name of names) {
      if (name == 'append') for (const f of args) domAppend.on(node, f);
      if (name == 'remove') for (const f of args) domRemove.on(node, f);
    }
  }),

  attr: Operator((node, names, args) => recurrent(() => {
    const value = toString(args);
    for (const name of names) node.setAttribute(name, value);
    onOperatorDisable(() => {
      for (const name of names) node.removeAttribute(name);
    });
  })),
  on: Operator((node, names, args) => {
    let options;
    for (const arg of args) if (typeof arg != 'function') options = arg;
    for (const e of names) for (const f of args)
      if (typeof f == 'function') node.addEventListener(e, f, options);
    onOperatorDisable(() => {
      for (const e of names) for (const f of args)
        if (typeof f == 'function') node.removeEventListener(e, f);
    });
  }),
  class: Operator((node, names, args) => recurrent(() => {
    const value = Boolean(unwrapFn(args[0]));
    if (!value) return;
    node.classList.add(...names.map(kebab));
    onOperatorDisable(() => {
      node.classList.remove(...names.map(kebab));
    });
  })),
  style: Operator((node, names, args) => recurrent(() => {
    const value = toString(args);
    for (const name of names) {
      if (name[0] == '-') node.style.setProperty(kebab(name), value);
      else node.style[name] = value; // slightly faster
    }
    onOperatorDisable(() => {
      for (const name of names) node.style.removeProperty(kebab(name));
    });
  })),
  prop: Operator((node, names, args) => recurrent(() => {
    const value = unwrapFn(args[0]);
    for (const name of names) node[name] = value;
    onOperatorDisable(() => {
      for (const name of names) delete node[name];
    });
  }))
}
