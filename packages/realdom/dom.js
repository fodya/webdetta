import Builder from '../common/builder.js';
import { r } from '../reactivity/index.js';
import { templateCallToArray } from '../common/utils.js';
import { textContent } from './operators.js';
import { domAppend, domRemove } from './dynamic.js';

const isTextNode = node => {
  const { nodeType } = node;
  return nodeType === 3 || nodeType === 8;
}

export const Element = (tag, ns) => (...args) => {
  const node = (
    tag === '' ? document.createTextNode('') :
    tag === '!' ? document.createComment('') :
    tag === ':' ? document.createDocumentFragment() :
    ns ? document.createElementNS(ns, tag) : document.createElement(tag)
  );
  return Element.append(node, templateCallToArray(args));
}
Element.from = arg => arg instanceof Node
  ? arg
  : Element('')(textContent(arg));

Element.append = (
  node, // Node | { after: Node } | { before: Node }
  item // Node
) => {
  if (item === undefined || item === null) {}
  else if (Array.isArray(item)) for (const d of item) Element.append(node, d);
  else if (Operator.isOperator(item)) Operator.apply(node, item);
  else if (isTextNode(node)) Operator.apply(node, textContent(item));
  else {
    const dom = Element.from(item);
    if (node instanceof Node) node.appendChild(dom);
    else if (node.after) node.after.after(dom);
    else if (node.before) node.before.before(dom);
    domAppend.trigger(dom);
  }
  return node;
}
Element.remove = (node) => {
  domRemove.trigger(node);
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
