import { Builder } from '../builder/index.js';
import { unwrapFn, templateCallToArray } from '../common/utils.js';
import { r } from '../reactivity/index.js';

export const toString = (...args) => {
  let str = '';
  for (const a of templateCallToArray(args)) str += unwrapFn(a);
  return str;
}

const isFragment = node => node.nodeType === 11;
export const processItem = (item, processOperator, processNode, flattenFragments=false) => {
  if (item === false || item === undefined || item === null) {

  } else if (Array.isArray(item)) {
    for (const d of item) processItem(d, processOperator, processNode, flattenFragments);
  } else if (Operator.isOperator(item)) {
    processOperator(item);
  } else {
    const node = Element.from(item);
    if (flattenFragments && isFragment(node)) {
      for (const child of node.childNodes) processNode(child);
    } else {
      processNode(node);
    }
  }
}

export const Element = (ns, tag, ...args) => {
  const node = (
    tag === '!' ? document.createComment('') :
    tag === ':' ? document.createDocumentFragment() :
    ns ? document.createElementNS(ns, tag) :
    document.createElement(tag)
  );
  return Element.append(node, templateCallToArray(args));
}
Element.from = arg => {
  if (arg instanceof Node) return arg;
  if (typeof arg == 'function') {
    const text = document.createTextNode('');
    r.effect(() => { text.textContent = toString(arg); });
    return text;
  }
  return document.createTextNode(arg);
}

const elementHooks = new WeakMap();
Element.registerHooks = (node, hooks) => elementHooks.set(node, hooks);

const performAppend = (node, method, item) => {
  const itemNode = Element.from(item);
  const hooks = elementHooks.get(itemNode);
  hooks?.beforeAppend?.();
  node[method](itemNode);
  hooks?.afterAppend?.();
}
Element.append = (node, item) => {
  processItem(item,
    op => Operator.apply(node, op),
    child => performAppend(node, 'appendChild', child),
    false
  );
  return node;
}
Element.appendBefore = (node, sibling) => performAppend(node, 'before', sibling);
Element.appendAfter = (node, sibling) => performAppend(node, 'after', sibling);

Element.remove = (node) => {
  const hooks = elementHooks.get(node);
  hooks?.beforeRemove?.();
  node.remove();
  hooks?.afterRemove?.();
}

export const Operator = (...funcs) => Builder((tasks, node) => {
  for (const {names, args} of tasks) {
    for (const func of funcs) {
      r.effect(() => func(node, names, args));
    }
  }
});
Operator.isOperator = Builder.isBuilder;
Operator.apply = (node, operator) => Builder.launch(operator, node);