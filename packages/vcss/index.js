import { kebab } from '../common/dom.js';
import { unwrapFn } from '../common/utils.js';
import { splitSelector, styleStr, processMethodArgs, selectorTmpl, escape, combinedStyle, ID } from './common.js';

const NODES = Symbol('VCSS_NODES');
export const inspect = obj => {
  if (typeof obj != 'function' && typeof obj != 'object') return null;
  const wrapped = obj && NODES in obj;
  return wrapped ? inspect(obj[NODES]) : obj;
}
const unwrapStyle = obj => {
  const res = {};
  for (const [k, v] of Object.entries(obj)) res[k] = unwrapFn(v);
  return res;
}
const unwrap = obj => (
  (obj = inspect(obj)) &&
  Array.isArray(obj) ? obj.flatMap(unwrap).filter(d => d)
  : obj instanceof Node ? obj
  : StyleNode(obj)
);

class StyleSheet {
  processedNodes = new Map();
  constructor(style) {
    this.style = style;
  }
  insertNode(node) {
    const { cls, css, additionalCss: css_ } = node;
    if (this.processedNodes.has(cls)) return;
    const stylesheet = this.style.sheet;
    this.processedNodes.set(cls, node);
    if (css) stylesheet.insertRule(css, stylesheet.cssRules.length);
    if (css_) stylesheet.insertRule(css_, stylesheet.cssRules.length);
  }
  recalculate() {
    this.style.innerText = '';
    const nodes = [...this.processedNodes.values()];
    this.processedNodes.clear();
    for (const node of nodes) {
      node.calculate();
      this.insertNode(node);
    }
  }
}

class Node {
  selector = ''
  query = ''
  important = false
  inline = false
  classname = null
  css = null
  additionalCss = null
  style = {}
  cls = null

  updates = []
  constructor(...updates) {
    this.updates = updates;
  }
  fork(...updates) {
    return new Node(...this.updates, ...updates);
  }
  calculate() {
    this.css = null;
    for (const update of this.updates) update.call(this);
    if (!this.style) return;
    this.prevCls = this.cls;
    this.cls = escape(
      (this.query ? '＠(' + ID('at', this.query) + ')' : '') +
      (this.selector ? '𝕊(' + this.selector + ')' : '') +
      (this.classname ? this.classname : '') +
      (this.important ? 'ǃ' : '')
    );

    const sel = selectorTmpl(this.selector, '.' + this.cls);
    const str = sel + styleStr(this.style, this.important);
    this.css = this.query ? `${this.query} {${str}}` : str;
  }
}

const StyleNode = (...args_) => new Node(function() {
  const args = args_.map(unwrapFn);
  if (args.length === 1) {
    this.style = unwrapStyle(args[0]);
    this.classname = '𝕀(' + ID('CSS', JSON.stringify(this.style)) + ')';
  } else {
    this.style = unwrapStyle(args[1]);
    this.classname = args[0];
  }
});
const MethodNode = (methods, name, args_) => {
  if (!methods[name]) throw new Error('method not found: ' + name);
  return new Node(function() {
    const args = processMethodArgs(args_);
    this.classname = name + '(' + args.join(',') + ')';
    this.style = methods[name](...args);
  });
}

const operators = {
  Sel: (selStr, ...args) => {
    const nodes = unwrap(args);
    return splitSelector(selStr).flatMap(selStr =>
      nodes.map(node => node.fork(function() {
        this.selector = node.selector
          ? selectorTmpl(selStr, node.selector)
          : selStr;
      }))
    );
  },
  Query: (query, ...args) =>
    unwrap(args).map(node => node.fork(function() {
      this.query = query;
    })),
  Important: (...args) =>
    unwrap(args).map(node => node.fork(function() {
      this.important = true;
    })),
  Inline: (...args) =>
    unwrap(args).map(node => node.fork(function() {
      this.inline = true;
    })),
  Transition: (param, ...args) => {
    const nodes = unwrap(args);
    return nodes.concat(new Node(function() {
      const keys = Object.keys(combinedStyle(nodes));
      const param_ = unwrapFn(param);
      this.classname = '𝕋(' +
        ID('transition', param_ + keys.join(',')) +
      ')';
      this.style = {
        transition: keys.map(k => param + ' ' + kebab(k)).join(',')
      };
    }));
  },
  Animation: (param, keyframes) => [new Node(function() {
    const str = Object.entries(keyframes).map(([ident, nodes]) => {
      nodes = unwrap(nodes);
      for (const node of nodes) node.calculate();
      const style = combinedStyle(nodes);
      return ident + '% ' + styleStr(style, false);
    }).join('\n');
    const kfId = ID('keyframes', str);
    const param_ = unwrapFn(param);
    const aId = ID('animation', param_ + kfId);
    this.classname = '𝔸(' + aId + ')';
    this.additionalCss = `@keyframes 𝔸${kfId} {\n${str}\n}`;
    this.style = { animation: param_ + ' 𝔸' + kfId };
  })],
}

const Stack = (wrap, methods) => {
  const style = (...args) => stack([],
    [StyleNode(...args)]
  );
  const operator = (name) => (...args) => stack([],
    operators[name](...args)
  );
  const method = (nodes, props) => (...args) => stack([],
    nodes.concat(props.map(name => MethodNode(methods, name, args)))
  );

  const stack = (props, nodes) => {
    nodes = unwrap(nodes);
    const res =
      props.length ? method(nodes, props)
      : !nodes.length ? style
      : wrap(nodes);
    return new Proxy(res, {
      has: (_, name) =>
        name == NODES || name in methods || name in operators || name in res,
      get: (_, name) =>
        typeof name == 'symbol'
        ? name == NODES ? nodes : res[name]
        : name in operators
        ? nodes.length == 0 && props.length == 0 ? operator(name) : null
        : stack(props.concat(name), nodes)
    });
  }
  return stack([], []);
}

export const Adapter = (wrapper) => ({ methods }) => {
  const style = document.createElement('style');
  document.head.appendChild(style);

  const styleSheet = new StyleSheet(style);
  const recalculate = styleSheet.recalculate;
  const v = Stack(wrapper.bind(null, styleSheet), methods);

  return { v, recalculate };
}
