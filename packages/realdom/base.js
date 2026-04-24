import { Builder } from '../builder/index.js';
import { templateCallToArray, callFn } from '../common/utils.js';
import { r } from '../reactivity/index.js';
import { createText } from "./dynamic.js";

export class Lazy {
  constructor(fn) {
    this.fn = fn;
  }
  static isLazy(item) {
    return item instanceof Lazy;
  }
}

const isFragment = node => node.nodeType === 11;

export const processItem = (item, processOperator, processNode, flattenFragments=false) => {
  const isObj = typeof item == 'object';
  const isFunc = typeof item == 'function';
  if (item === false || item === undefined || item === null) {
    //
  } else if (isObj && Array.isArray(item)) {
    for (const d of item) processItem(d, processOperator, processNode, flattenFragments);
  } else if (isFunc && Operator.isOperator(item)) {
    processOperator(item);
  } else if (isObj && Lazy.isLazy(item)) {
    processItem(callFn(item.fn), processOperator, processNode, flattenFragments);
  } else if ((isObj || isFunc) && Element.toNodes in item) {
    processItem(item[Element.toNodes](), processOperator, processNode, flattenFragments);
  } else {
    const itemNode = Element.from(item);
    if (flattenFragments && isFragment(itemNode)) {
      for (const child of itemNode.childNodes) processNode(child);
    } else {
      processNode(itemNode);
    }
  }
}

export const Element = (ns, tag, ...args) => {
  const node = (
    tag === '' ? document.createTextNode('') :
    tag === '!' ? document.createComment('') :
    tag === ':' ? document.createDocumentFragment() :
    ns ? document.createElementNS(ns, tag) :
    document.createElement(tag)
  );
  return Element.append(node, templateCallToArray(args));
}
Element.toNodes = Symbol('Element.toNodes');
Element.from = arg => {
  if (arg instanceof Node) return arg;
  return createText(arg);
}

const hooks = {
  beforeAppend: new WeakMap(),
  afterAppend: new WeakMap(),
  beforeRemove: new WeakMap(),
  afterRemove: new WeakMap(),
};
Element.registerHook = (node, hook, handler) => {
  const map = hooks[hook];
  let set = map.get(node);
  if (!set) map.set(node, set = new Set());
  set.add(handler);
}
const triggerHook = (node, hook) => {
  const set = hooks[hook].get(node);
  if (!set) return;
  for (const handler of set) handler();
}

const performAppend = (node, method, item) => {
  const itemNode = Element.from(item);
  triggerHook(itemNode, 'beforeAppend');
  node[method](itemNode);
  triggerHook(itemNode, 'afterAppend');
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
  triggerHook(node, 'beforeRemove');
  node.remove();
  triggerHook(node, 'afterRemove');
}

export const Operator = (func, { track=true }={}) => Builder((tasks, node) => {
  for (const {names, args} of tasks) {
    r.effect(() => func(node, names, args), { track });
  }
});
Operator.isOperator = Builder.isBuilder;
Operator.apply = (node, operator) => Builder.launch(operator, node);