import Builder from '../common/builder.js';
import { Context } from '../common/context.js';
import { r } from '../reactivity/index.js';
import { templateCallToArray } from '../common/utils.js';
import { textContent } from './operators.js';

const NS = {
  svg: 'http://www.w3.org/2000/svg',
  math: 'http://www.w3.org/1998/Math/MathML'
};
export const currentNS = Context();
export const initializing = Context();

const builder = Builder.symbol;

const processContent = (node, content) => {
  const init = initializing();
  let child = init ? null : node.firstChild;
  const appendChild = item => node.appendChild(render(item));
  const applyOperator = item => hydrate(node, item);
  const hydrateChild = item => {
    const next = child?.nextSibling;
    hydrate(child, item);
    child = next;
  }

  const isTextNode = node.nodeType === 3 || node.nodeType === 8;
  const process = list => {
    for (const item of list) switch (item[builder]) {
      case 1: (init ? appendChild : hydrateChild)(item); break;
      case 2: applyOperator(item); break;
      default:
        if (Array.isArray(item)) process(item);
        else if (isTextNode) applyOperator(textContent(item));
        else if (init) {
          if (item instanceof Node) {}
          else appendChild(Element('')(textContent(item)));
        } else {
          if (item instanceof Node) node.insertBefore(item, child);
          else hydrateChild(textContent(item));
        }
    }
  }
  process(templateCallToArray(content));
  return node;
}
export const Element = (tag) => {
  const effect = (tasks, node) => {
    if (!node) switch (tag) {
      case '': node = document.createTextNode(''); break;
      case '!': node = document.createComment(''); break;
      case ':': node = document.createDocumentFragment(); break;
      default: {
        const ns = currentNS();
        node = ns
          ? document.createElementNS(ns, tag)
          : document.createElement(tag);
      }
    }
    return currentNS.run(NS[tag] ?? currentNS(),
      processContent, node, tasks.map(t => t.args)
    );
  }
  effect[builder] = 1;
  return Builder(effect);
}
Element.from = arg =>
  arg?.[builder] === 1 ? arg :
  Array.isArray(arg) ? Element(':')(...arg) :
  Element('')(arg);


export const Operator = (defer, func) => {
  const effect = (tasks, node) => {
    const init = initializing();
    const force = init === null;
    for (const {names, args} of tasks) {
      const shouldRun = force || (init
        ? !defer
        : args.some(d => typeof d == 'function'));
      if (shouldRun) func(node, names, args);
    }
  }
  effect[builder] = 2;
  return Builder(effect);
}

export const Component = func => {
  let tmpl;
  return func.component ??= (...args) => {
    let elem = func(...args);
    if (elem instanceof Node) return elem;
    elem = Element.from(elem);
    tmpl ??= initializing.run(true, render, elem);
    const effect = tasks => initializing.run(false, () => {
      const elem_ = elem(...tasks.map(t => t.args));
      return hydrate(tmpl.cloneNode(true), elem_);
    });
    effect[builder] = 1;
    return Builder(effect);
  }
}
export const render = elem => Builder.launch(elem);
export const hydrate = (node, elem) => Builder.launch(elem, node);
