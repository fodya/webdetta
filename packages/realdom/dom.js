import Builder from '../common/builder.js';
import { r } from '../reactivity/index.js';
import { templateCallToArray } from '../common/utils.js';
import { textContent } from './operators.js';

const builder = Builder.symbol;
const elementBuilder = (tag, func) => {
  const effect = (tasks, node, init) => {
    let res; for (const {args} of tasks) res ??= func(node, args, init);
    return res;
  }
  effect[builder] = 1;
  return Builder(effect);
}

export const Operator = (defer, func) => {
  const effect = (tasks, node, init) => {
    for (const {names, args} of tasks) {
      const shouldRun = init === null || (init
        ? !defer
        : args.some(d => typeof d == 'function'));
      if (shouldRun) func(node, names, args);
    }
  }
  effect[builder] = 2;
  return Builder(effect);
}

const NS = {
  svg: 'http://www.w3.org/1998/Math/MathML',
  math: 'http://www.w3.org/1998/Math/MathML'
};
export const Element = tag => elementBuilder(tag, (node, content, init, ns) => {
  if (!node && (init = true)) switch (tag) {
    case '': node = document.createTextNode(''); break;
    case '!': node = document.createComment(''); break;
    case ':': node = document.createDocumentFragment(); break;
    default: node = (
      (ns = NS[tag] ?? ns)
      ? document.createElementNS(ns, tag)
      : document.createElement(tag)
    );
  }

  let child = init ? null : node.firstChild;
  const append = item => {
    const child = Builder.launch(item, null, init, ns);
    node.appendChild(child);
  }
  const hydrate = (item) => {
    const next = child?.nextSibling;
    Builder.launch(item, child, init, ns);
    child = next;
  }
  const apply = item => {
    Builder.launch(item, node, init, ns);
  }

  const process = list => {
    for (const item of list) switch (item[builder]) {
      case 1: (init ? append : hydrate)(item); break;
      case 2: apply(item); break;
      default:
        if (Array.isArray(item)) process(item);
        else if (tag === '' || tag === '!') apply(textContent(item));
        else if (init) {
          if (item instanceof Node) {}
          else append(Element('')(textContent(item)));
        } else {
          if (item instanceof Node) child.before(item);
          else hydrate(textContent(item));
        }
    }
  }
  process(templateCallToArray(content));
  return node;
});
Element.from = arg =>
  arg && arg[builder] === 1 || arg instanceof Node ? arg :
  typeof arg === 'function' ? Element.from(arg()) :
  Array.isArray(arg) ? Element(':')(...arg) :
  Element('')(arg);

export const Component = func => {
  let tmpl;
  return func.component ??= function (...args) {
    const elem = Element.from(func(...args));
    if (!Builder.isBuilder(elem)) return elem;
    tmpl ??= Builder.launch(elem, null);
    return Builder.launch(elem, tmpl.cloneNode(true));
  }
}
