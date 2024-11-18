import { kebab } from '../common/dom.js';
import { unwrapFn } from '../common/func.js';
import { r } from '../reactivity/index.js';
import { Operator } from './dom.js';

const toString = args => {
  let str = '';
  for (const a of args) str += unwrapFn(a);
  return str;
}

export const textContent = Operator(false, (node, _, args) => r.effect(() => {
  node.textContent = toString(args)
}));

export const ref = Operator(true, (node, _, args) => {
  for (const func of args) func(node);
});
export const attr = Operator(false, (node, names, args) => r.effect(() => {
  const value = toString(args);
  for (const name of names) node.setAttribute(name, value);
}));
export const on = Operator(true, (node, names, args) => {
  for (const name of names)
    for (const func of args)
      node.addEventListener(name, func);
});
export const style = Operator(false, (node, names, args) => r.effect(() => {
  const value = toString(args);
  for (const name of names) node.style.setProperty(kebab(name), value)
}));
export const prop = Operator(true, (node, names, args) => r.effect(() => {
  const value = toString(args);
  for (const name of names) node[name] = value;
}));
export const propRaw = Operator(true, (node, names, args) => {
  const value = args[0];
  for (const name of names) node[name] = value;
});
