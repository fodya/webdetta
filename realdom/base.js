/**
 * Lightweight and efficient DOM library
 * @example ./examples/index.example.js
 * @module
 */
import { Builder } from "@webdetta/builder";
import { r } from "@webdetta/reactivity";
import { templateCallToArray } from "@webdetta/common/func";
import { createText } from "./runtime.js";

/**
 * @callback OperatorCallable
 * @param {...unknown} args
 * @returns {Operator}
 */

/**
 * @typedef {OperatorCallable & { key?: (...args: unknown[]) => Operator }} Operator
 */

/**
 * @callback OperatorFunc
 * @param {Node} node
 * @param {string[]} names
 * @param {unknown[]} args
 * @returns {void | (() => void)}
 */

/**
 * @typedef {'beforeAppend' | 'afterAppend' | 'beforeRemove' | 'afterRemove'} HookName
 */

/**
 * @typedef {{ [key: symbol]: () => ElementItem }} DeferredElementItem
 */

/**
 * @typedef {Node | string | number | boolean | null | undefined | Operator | DeferredElementItem | (() => unknown) | ElementItem[]} ElementItem
 */

/**
 * @callback ElementFnCallable
 * @param {string | null} ns
 * @param {string} tag
 * @param {...ElementItem} args
 * @returns {Node}
 */

/**
 * @typedef {ElementFnCallable & {
 *   lazy: symbol,
 *   from: (arg: unknown) => Node,
 *   registerHook: (node: Node, hook: HookName, handler: () => void) => void,
 *   append: (node: Node, item: ElementItem | ElementItem[]) => Node,
 *   appendBefore: (node: Node, sibling: ElementItem) => void,
 *   appendAfter: (node: Node, sibling: ElementItem) => void,
 *   remove: (node: Node) => void
 * }} ElementFn
 */

/**
 * @callback OperatorFactoryCallable
 * @param {OperatorFunc} func
 * @param {{ track?: boolean }} [options]
 * @returns {Operator}
 */

/**
 * @typedef {OperatorFactoryCallable & {
 *   isOperator: (f: unknown) => boolean,
 *   apply: (node: Node, operator: Operator) => unknown
 * }} OperatorFactory
 */

const isFragment = (node) => node.nodeType === 11;

/**
 * @param {ElementItem} item
 * @param {(op: Operator) => void} processOperator
 * @param {(node: Node) => void} processNode
 * @param {boolean} [flattenFragments]
 */
export const processItem = (
  item,
  processOperator,
  processNode,
  flattenFragments = false,
) => {
  const isObj = typeof item == "object";
  const isFunc = typeof item == "function";
  if (item === false || item === undefined || item === null) {
    //
  } else if (isObj && Array.isArray(item)) {
    for (const d of item) {
      processItem(d, processOperator, processNode, flattenFragments);
    }
  } else if (isFunc && Operator.isOperator(item)) {
    processOperator(item);
  } else if ((isObj || isFunc) && Element.lazy in item) {
    processItem(
      item[Element.lazy](),
      processOperator,
      processNode,
      flattenFragments,
    );
  } else {
    const itemNode = Element.from(item);
    if (flattenFragments && isFragment(itemNode)) {
      for (const child of itemNode.childNodes) processNode(child);
    } else {
      processNode(itemNode);
    }
  }
};

/** @type {ElementFn} */
export const Element = (ns, tag, ...args) => {
  let node;
  switch (tag) {
    case "":
      node = document.createTextNode("");
      break;
    case "!":
      node = document.createComment("");
      break;
    case ":":
      node = document.createDocumentFragment();
      break;
    default:
      node = document.createElementNS(ns, tag);
  }
  return Element.append(node, templateCallToArray(args));
};
Element.lazy = Symbol("Element.lazy");
Element.from = (arg) => {
  if (arg instanceof Node) return arg;
  return createText(arg);
};

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
};
const triggerHook = (node, hook) => {
  const set = hooks[hook].get(node);
  if (!set) return;
  for (const handler of set) handler();
};

const performAppend = (node, method, item) => {
  const itemNode = Element.from(item);
  triggerHook(itemNode, "beforeAppend");
  node[method](itemNode);
  triggerHook(itemNode, "afterAppend");
};
Element.append = (node, item) => {
  processItem(
    item,
    (op) => Operator.apply(node, op),
    (child) => performAppend(node, "appendChild", child),
    false,
  );
  return node;
};
Element.appendBefore = (node, sibling) =>
  performAppend(node, "before", sibling);
Element.appendAfter = (node, sibling) => performAppend(node, "after", sibling);

Element.remove = (node) => {
  triggerHook(node, "beforeRemove");
  node.remove();
  triggerHook(node, "afterRemove");
};

/** @type {OperatorFactory} */
export const Operator = (func, { track = true } = {}) =>
  Builder((tasks, node) => {
    for (const { names, args } of tasks) {
      if (args.some((arg) => typeof arg == "function")) {
        r.effect(() => func(node, names, args), { track });
      } else {
        func(node, names, args);
      }
    }
  });
Operator.isOperator = Builder.isBuilder;
Operator.apply = (node, operator) => Builder.launch(operator, node);
