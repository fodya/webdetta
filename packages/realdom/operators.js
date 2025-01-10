import { kebab } from '../common/dom.js';
import { err, unwrapFn, templateCallToArray } from '../common/utils.js';
import { r } from '../reactivity/index.js';
import { Element, Operator } from './dom.js';
import { createList, createIf, onRemove } from './dynamic.js';

const toString = args => {
  let str = '';
  for (const a of templateCallToArray(args)) str += unwrapFn(a);
  return str;
}

export const recurrent = (func) => {
  let stopped;
  r.effect(() => (!stopped) && func());
  onRemove(() => { stopped = true; });
}

export const textContent = Operator((node, _, args) => r.effect(() => {
  node.textContent = toString(args);
}));

const ifBuilder = (conditions, finalized=false) => {
  const get = (_, key) =>
    finalized && (key == 'elif' || key == 'else') ? err`Cannot get: ${key}`
    : key == 'elif' ? (cond, ...args) =>
      ifBuilder([...conditions, { cond, args }], false)
    : key == 'else' ? (...args) =>
      ifBuilder([...conditions, { cond: true, args }], true)
    : null;
  const op = ref(node => createIf(node, conditions));
  return Operator.extend(op, { get })
};

const ref = Operator((node, _, args) => {
  for (const func of args) func(node);
});

export const operators = {
  append: (node, ...args) => Element.append(node, args),
  ref: ref,
  list: (items, render, keyFn) => Element(':')(ref(node =>
    createList(node, items, render, keyFn)
  )),
  if: (cond, ...args) =>
    ifBuilder([{ cond, args }], false),

  attr: Operator((node, names, args) => recurrent(() => {
    const value = toString(args);
    for (const name of names) node.setAttribute(name, value);
    onRemove(() => {
      for (const name of names) node.removeAttribute(name);
    });
  })),
  on: Operator((node, names, args) => {
    let options;
    const funcs = [];
    for (const arg of args) if (typeof arg != 'function') options = arg;
    for (const e of names) for (const f of args)
      if (typeof f == 'function') node.addEventListener(e, f, options);
    onRemove(() => {
      for (const e of names) for (const f of args)
        if (typeof f == 'function') node.removeEventListener(e, f);
    });
  }),
  class: Operator((node, names, args) => recurrent(() => {
    const value = Boolean(unwrapFn(args[0]));
    if (!value) return;
    node.classList.add(...names.map(kebab));
    onRemove(() => {
      node.classList.remove(...names.map(kebab));
    });
  })),
  style: Operator((node, names, args) => recurrent(() => {
    const value = toString(args);
    for (const name of names) node.style.setProperty(kebab(name), value);
    onRemove(() => {
      for (const name of names) node.style.removeProperty(kebab(name));
    });
  })),
  prop: Operator((node, names, args) => recurrent(() => {
    const value = unwrapFn(args[0]);
    for (const name of names) node[name] = value;
    onRemove(() => {
      for (const name of names) delete node[name];
    });
  }))
}
