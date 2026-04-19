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
  const isObj = typeof item == 'object';
  const isFunc = typeof item == 'function';
  if (item === false || item === undefined || item === null) {

  } else if (isObj && Array.isArray(item)) {
    for (const d of item) processItem(d, processOperator, processNode, flattenFragments);
  } else if (isFunc && Operator.isOperator(item)) {
    processOperator(item);
  } else if ((isObj || isFunc) && Element.toNodes in item) {
    processItem(item[Element.toNodes](), processOperator, processNode, flattenFragments);
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

Element.toNodes = Symbol('Element.toNodes');
Element.from = arg => {
  if (arg instanceof Node) return arg;
  if (typeof arg == 'function') {
    const text = document.createTextNode('');
    r.effect(() => { text.textContent = toString(arg); });
    return text;
  }
  return document.createTextNode(arg);
}

const hooks = {
  beforeAppend: new WeakMap(),
  afterAppend: new WeakMap(),
  beforeRemove: new WeakMap(),
  afterRemove: new WeakMap(),
}
Element.registerHook = (node, hook, handler) => {
  const map = hooks[hook];
  const prev = map.get(node);
  map.set(node, function hook() { prev?.(); handler(); });
}

const performAppend = (node, method, item) => {
  const itemNode = Element.from(item);
  const { beforeAppend, afterAppend } = hooks;
  beforeAppend.get(itemNode)?.();
  node[method](itemNode);
  afterAppend.get(itemNode)?.();
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
  const { beforeRemove, afterRemove } = hooks;
  beforeRemove.get(node)?.();
  node.remove();
  afterRemove.get(node)?.();
}

export const Operator = (func, { track=true }={}) => Builder((tasks, node) => {
  for (const {names, args} of tasks) {
    r.effect(() => func(node, names, args), { track });
  }
});
Operator.isOperator = Builder.isBuilder;
Operator.apply = (node, operator) => Builder.launch(operator, node);