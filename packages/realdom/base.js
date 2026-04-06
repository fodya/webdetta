import { Builder } from '../builder/index.js';
import { unwrapFn, templateCallToArray } from '../common/utils.js';
import { domAppendTrigger, domRemoveTrigger } from './dynamic.js';
import { r } from '../reactivity/index.js';

export const toString = (...args) => {
  let str = '';
  for (const a of templateCallToArray(args)) str += unwrapFn(a);
  return str;
}

const isFragment = node => node.nodeType === 11;
export const processItem = (item, processOperator, processNode, flattenFragments=false) => {
  if (item === undefined || item === null) {}
  else if (Array.isArray(item)) {
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

export const Element = (tag, ns) => (...args) => {
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
    r.effect(() => text.textContent = toString(arg));
    return text;
  }
  return document.createTextNode(arg);
}

const performAppend = (node, method, item) => {
  const dom = Element.from(item);
  node[method](dom);
  domAppendTrigger(dom);
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
  domRemoveTrigger(node);
  node.remove();
}

export const Operator = (...funcs) => Builder((tasks, node) => {
  for (const {names, args} of tasks)
    for (const func of funcs)
      func(node, names, args);
});
Operator.isOperator = Builder.isBuilder;
Operator.apply = (node, operator) => Builder.launch(operator, node);
Operator.extend = (operator, { get }) => new Proxy(operator, {
  get: (_, key) => get(_, key) ?? operator[key]
});