import Builder from '../common/builder.js';
import { templateCallToArray } from '../common/func.js';
import { textContent } from './operators.js';

const isReactive = args =>
  args.some(d => typeof d == 'function');

export const builder = Builder.symbol;
const elementBuilder = (tag, func) => {
  const effect = (tasks, node, init) => {
    let res; for (const {args} of tasks) res ??= func(args, node, init);
    return res;
  }
  effect[builder] = 1;
  return Builder(effect);
}

export const Operator = (defer, func) => {
  const effect = (tasks, node, init) => {
    for (const {names, args} of tasks) {
      if (init ? !defer : isReactive(args)) func(node, names, args, init)
    }
  }
  effect[builder] = 2;
  return Builder(effect);
}

export const Element = tag => elementBuilder(tag, (content, node, init) => {
  if (!node && (init = true)) switch (tag) {
    case '': node = document.createTextNode(''); break;
    case '!': node = document.createComment(''); break;
    case ':': node = document.createDocumentFragment(); break;
    default: node = document.createElement(tag);
  }

  let child = init ? null : node.firstChild;
  const append = item => node.appendChild(Builder.launch(item, null, init));
  const hydrate = (item) => {
    const next = child?.nextSibling;
    Builder.launch(item, child, init);
    child = next;
  }
  const apply = item => Builder.launch(item, node, init);

  for (const item of templateCallToArray(content)) switch (item[builder]) {
    case 1: (init ? append : hydrate)(item); break;
    case 2: apply(item); break;
    default:
      if (tag === '' || tag === '!') apply(textContent(item));
      else if (init) {
        if (item instanceof Node) {}
        else append(Element('')(textContent(item)));
      } else {
        if (item instanceof Node) child.before(item);
        else hydrate(textContent(item));
      }
  }
  return node;
});

export const Component = func => {
  let tmpl;
  return func.component ??= (...args) => {
    const elem = func(...args);
    if (elem instanceof Node) return elem;
    tmpl ??= Builder.launch(elem, null);
    return Builder.launch(elem, tmpl.cloneNode(true));
  }
}
