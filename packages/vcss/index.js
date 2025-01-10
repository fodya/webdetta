import { kebab } from '../common/dom.js';
import { isTemplateCall, unwrapFn } from '../common/utils.js';

const ID = (() => {
  const store = {}, indexes = {};
  return (type, value) => store[type + value] ??= (
    indexes[type] ??= -1,
    ++indexes[type]
  );
})();
const chars = Object.fromEntries([...
  ` ␣(⦗)⦘:᛬.ꓸ,‚[❲]❳|⼁#＃<﹤>﹥{❴}❵"“'‘%％!ǃ&＆*∗/∕@＠`.matchAll(/../g)
].map(v => v[0].split('')));
const escape = str => {
  let res = '';
  for (const v of str) res += chars[v] ?? v;
  return CSS.escape(res);
}
const selectorTmpl = (sel='', val='') => (
  typeof sel == 'function' ? sel(val)
  : sel.includes('&') ? sel.replaceAll('&', val)
  : val + sel
);
const splitSelector = str => [str];
const styleStr = (style, important) => `{${
  Object.entries(style).map(([k, v]) =>
    kebab(k) + ': ' + v + (important ? ' !important' : '') + ';'
  ).join('')
}}`;

const processMethodArgs = args =>
  isTemplateCall(args)
  ? String.raw(...args).match(/\S+/g) ?? []
  : args.flatMap(unwrapFn);

const NODES = Symbol('VCSS_NODES');
export const inspect = obj => {
  if (typeof obj != 'function' && typeof obj != 'object') return null;
  const wrapped = obj && NODES in obj;
  return wrapped ? inspect(obj[NODES]) : obj;
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

const unwrapStyle = obj => {
  const res = {};
  for (const [k, v] of Object.entries(obj)) res[k] = unwrapFn(v);
  return res;
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

const unwrap = obj => (
  (obj = inspect(obj)) &&
  Array.isArray(obj) ? obj.flatMap(unwrap).filter(d => d)
  : obj instanceof Node ? obj
  : StyleNode(obj)
);

const joinStyle = (sep, v1, v2) => v1 && v2 ? v1 + sep + v2 : v1 ?? v2;
const combinedStyle = nodes => {
  const res = {};
  for (const node of nodes) {
    node.calculate();
    Object.assign(res, node.style ?? {});
  }
  return res;
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
  Animation: (param, keyframes) => [new Node(function(esc) {
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

const Processor = ({ addStyle, addClass, removeClass }) => {
  const style = document.createElement('style');
  document.head.appendChild(style);
  const stylesheet = style.sheet;

  const processedNodes = {};
  const insertRule = node => {
    stylesheet.insertRule(node.css, stylesheet.cssRules.length);
    if (node.additionalCss)
      stylesheet.insertRule(node.additionalCss, stylesheet.cssRules.length);
  }
  const process = (elem, node) => {
    node.calculate();
    if (node.inline) addStyle(elem, node.style);
    else {
      if (!processedNodes[node.cls]) {
        insertRule(node);
        processedNodes[node.cls] = node
      }
      if (node.prevCls && node.cls != node.prevCls) removeClass?.(elem, node.prevCls);
      addClass(elem, node.cls);
    }
  }
  const recalculate = () => {
    style.innerText = '';
    for (const node of Object.values(processedNodes)) {
      node.calculate();
      insertRule(node);
    }
  }

  return { process, recalculate }
}

export const Adapter = (options) => ({ methods, enumerate=false }) => {
  const { wrapper, addClass, addStyle, removeClass } = options;
  const { process, recalculate } = Processor({ addStyle, addClass, removeClass });
  const wrap = (nodes) => wrapper(nodes, process);
  const v = Stack(wrap, methods);
  return { v, recalculate };
}
