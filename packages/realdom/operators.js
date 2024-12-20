import Builder from '../common/builder.js';
import { kebab } from '../common/dom.js';
import { err, callFn, unwrapFn } from '../common/utils.js';
import { r } from '../reactivity/index.js';
import { Element, Operator } from './dom.js';
import { createList, createIf } from './dynamic.js';

export const cancellableEffect = (func) => {
  let stopped;
  let undo; r.effect(() => {
    if (stopped) return null;
    undo = func();
  });
  return () => {
    stopped = true;
    undo();
  }
}

const toString = args => {
  let str = '';
  for (const a of args) str += unwrapFn(a);
  return str;
}

export const textContent = Operator((node, _, args) => r.effect(() => {
  node.textContent = toString(args);
}));

export const ref = Operator((node, _, args) => {
  const undo = [];
  for (const func of args) {
    const res = func(node);
    if (res !== undefined) undo.push(res);
  }
  return () => {
    for (const func of undo) func();
  }
});
export const attr = Operator((node, names, args) => cancellableEffect(() => {
  const value = toString(args);
  for (const name of names) node.setAttribute(name, value);
  return () => {
    for (const name of names) node.removeAttribute(name);
  }
}));
export const on = Operator((node, names, args) => {
  for (const name of names) for (const func of args)
    node.addEventListener(name, func);

  return () => {
    for (const name of names) for (const func of args)
      node.removeEventListener(name, func);
  }
});
const class_ = Operator((node, names, args) => cancellableEffect(() => {
  const value = Boolean(unwrapFn(args[0]));
  if (!value) return;
  node.classList.add(...names.map(kebab));
  return () => {
    node.classList.remove(...names.map(kebab));
  }
}));
export { class_ as 'class' };
export const style = Operator((node, names, args) => cancellableEffect(() => {
  const value = toString(args);
  for (const name of names) node.style.setProperty(kebab(name), value);
  return () => {
    for (const name of names) node.style.removeProperty(name);
  }
}));

export const prop = Operator((node, names, args) => cancellableEffect(() => {
  const value = unwrapFn(args[0]);
  for (const name of names) node[name] = value;
  return () => {
    for (const name of names) delete node[name];
  }
}));

export const list = (itemsFn, render, keyFn) => ref(root => {
  return createList(root, itemsFn, render, keyFn);
});

export const append = Element.append;

const ifBuilder = (conditions, finalized=false) => {
  const operator = ref(node => createIf(node, conditions));
  return new Proxy(operator, {
    get: (_, key) =>
      finalized && (key == 'elif' || key == 'else') ? err(`Cannot get: ${key}`)
      : key == 'elif' ? (cond, ...args) =>
        ifBuilder([...conditions, { cond, args }], false)
      : key == 'else' ? (...args) =>
        ifBuilder([...conditions, { cond: true, args }], true)
      : operator[key]
  });
}

const if_ = (cond, ...args) =>
  ifBuilder([{ cond, args }], false);

export { if_ as 'if' };
