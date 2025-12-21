import { Builder } from '../builder/index.js';
import { templateCallToArray } from '../common/utils.js';
import { textContent } from './operators.js';
import { domAppendTrigger, domRemoveTrigger } from './dynamic.js';
import { r } from '../reactivity/index.js';

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
  node, // Node
  item, // Node | Array<Node> | Operator | Function
  appendType = 'child' // 'child' | 'before' | 'after'
) => {
  if (item === undefined || item === null) {}
  else if (Array.isArray(item)) for (const d of item) Element.append(node, d, appendType);
  else if (Operator.isOperator(item)) Operator.apply(node, item);
  else if (isTextNode(node) && !(item instanceof Node)) Operator.apply(node, textContent(item));
  else {
    const dom = Element.from(item);
    switch (appendType) {
      case 'child': node.appendChild(dom); break;
      case 'before': node.before(dom); break;
      case 'after': node.after(dom); break;
    }
    domAppendTrigger(dom);
  }
  return node;
}
Element.remove = (node) => {
  domRemoveTrigger(node);
  node.remove();
}

Element.isLazyElement = item => typeof item == 'function' && !Operator.isOperator(item);

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
Operator.CLEANUP = Symbol('Operator.CLEANUP');
Operator.onCleanup = (func) => r.onAbort(reason => {
  if (reason === Operator.CLEANUP) func(reason);
});