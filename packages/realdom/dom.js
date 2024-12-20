import Builder from '../common/builder.js';
import { Context } from '../common/context.js';
import { r } from '../reactivity/index.js';
import { templateCallToArray } from '../common/utils.js';
import { textContent } from './operators.js';

const NS = {
  svg: 'http://www.w3.org/2000/svg',
  math: 'http://www.w3.org/1998/Math/MathML'
};
const isTextNode = node => {
  const { nodeType } = node;
  return nodeType === 3 || node.nodeType === 8;
}

export const Element = (tag, ns) => (...args) => {
  const node = (
    tag == '' ? document.createTextNode('') :
    tag == '!' ? document.createComment('') :
    tag == ':' ? document.createDocumentFragment() :
    ns ? document.createElementNS(ns, tag) : document.createElement(tag)
  );
  Element.append(node, templateCallToArray(args));
  return node;
}
Element.from = arg => {
  if (Array.isArray(arg)) return Element(':')(...arg);
  if (arg instanceof Node) return arg;
  return Element('')(arg);
}
Element.append = (node, item) => {
  if (Array.isArray(item)) for (const d of item) Element.append(node, d);
  else if (Operator.isOperator(item)) Operator.apply(node, item);
  else if (isTextNode(node)) Operator.apply(node, textContent(item));
  else if (item instanceof Node) node.appendChild(item);
  else node.appendChild(Element('')(textContent(item)));
}

export const Operator = (func) => Builder((tasks, node, undoQueue) => {
  for (const {names, args} of tasks) {
    const res = func(node, names, args);
    if (undoQueue && res) undoQueue.push(res);
  };
});
Operator.isOperator = Builder.isBuilder;
Operator.apply = (node, item, undoQueue) => {
  Builder.launch(item, node, undoQueue);
}
