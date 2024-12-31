import Builder from '../common/builder.js';
import { kebab } from '../common/dom.js';
import { err, unwrapFn } from '../common/utils.js';
import { r } from '../reactivity/index.js';
import { Element, Operator } from './dom.js';
import { createList, createIf } from './dynamic.js';

const toString = args => {
  let str = '';
  for (const a of args) str += unwrapFn(a);
  return str;
}

export const operation = (func) => {
  let stopped, undo;
  r.effect(() => (!stopped) && (undo = func()));
  return () => (stopped = true, undo());
}

export const performUndo = undo => {
  if (Array.isArray(undo)) for (const item of undo) performUndo(item);
  else if (undo) undo();
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
  return Operator.extend(ref(node => createIf(node, conditions)), { get })
};

const ref = Operator((node, _, args) => args.map(func => func(node)));

export const operators = {
  append: Element.append,
  ref: ref,
  attr: Operator((node, names, args) => operation(() => {
    const value = toString(args);
    for (const name of names) node.setAttribute(name, value);
    return () => {
      for (const name of names) node.removeAttribute(name);
    }
  })),
  on: Operator((node, names, args) => {
    for (const name of names) for (const func of args)
      node.addEventListener(name, func);

    return () => {
      for (const name of names) for (const func of args)
        node.removeEventListener(name, func);
    }
  }),
  class: Operator((node, names, args) => operation(() => {
    const value = Boolean(unwrapFn(args[0]));
    if (!value) return;
    node.classList.add(...names.map(kebab));
    return () => {
      node.classList.remove(...names.map(kebab));
    }
  })),
  style: Operator((node, names, args) => operation(() => {
    const value = toString(args);
    for (const name of names) node.style.setProperty(kebab(name), value);
    return () => {
      for (const name of names) node.style.removeProperty(kebab(name));
    }
  })),
  prop: Operator((node, names, args) => operation(() => {
    const value = unwrapFn(args[0]);
    for (const name of names) node[name] = value;
    return () => {
      for (const name of names) delete node[name];
    }
  })),
  list: (items, render, keyFn) => ref(node =>
    createList(node, items, render, keyFn)
  ),
  if: (cond, ...args) =>
    ifBuilder([{ cond, args }], false)
}
