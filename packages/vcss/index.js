import { kebab } from '../common/dom.js';
import { isTemplateCall } from '../common/func.js';

const ID = ((r={}, i={}) => (t, v) => {
  return r[t+v] ??= i[t] = (i[t] ??= -1) + 1;
})();
const chars = Object.fromEntries([...
  ` ␣(⦗)⦘:᛬.ꓸ,‚[❲]❳|⼁#＃<﹤>﹥{❴}❵"“'‘%％!ǃ&＆*∗/∕`.matchAll(/../g)
].map(v => v[0].split('')));
const escape = str => CSS.escape(str.replaceAll(/./g, v => chars[v] ?? v));
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

const unwrapfn = f => typeof f == 'function' ? unwrapfn(f()) : f;
const processMethodArgs = args =>
  isTemplateCall(args)
  ? Array.from(String.raw(...args).matchAll(/('.*?'|".*?"|\S+)/g))
      .map(d => d[0].replace(/(^['"])|(['"]$)/g, ''))
  : args.map(unwrapfn);

const NODES = Symbol('VCSS_NODES');
export const inspect = obj => {
  if (typeof obj != 'function' && typeof obj != 'object') return null;
  const wrapped = obj && NODES in obj;
  return wrapped ? inspect(obj[NODES]) : obj;
}

class Node {
  selector = ''
  media = ''
  important = false
  inline = false
  classname = null
  rules = []
  style = {}
  cls = null

  updates = []
  constructor(...updates) {
    this.updates = updates;
  }
  fork(...updates) {
    return new Node(...this.updates, ...updates);
  }

  init(esc=escape) {
    if (!this.cls) this.update(esc);
  }
  update(esc=escape) {
    for (const update of this.updates) update.call(this, esc);
    this.cls = esc(
      (this.media ? '𝕄(' + this.media + ')' : '') +
      (this.selector ? '𝕊(' + this.selector + ')' : '') +
      (this.classname ? this.classname : '') +
      (this.important ? 'ǃ' : '')
    );
  }
  css() {
    const sel = selectorTmpl(this.selector, '.' + this.cls);
    const str = sel + styleStr(this.style, this.important);
    return [
      ...this.rules,
      this.media ? `@media ${this.media} {${str}}` : str
    ];
  }
}

const StyleNode = (...args_) => new Node(function() {
  const args = args_.map(unwrapfn);
  if (args.length === 1) {
    this.classname = 'CSS(' + JSON.stringify(args[0]) + ')';
    this.style = args[0];
  } else {
    this.classname = args[0];
    this.style = args[1];
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
  : typeof obj == 'function' ? unwrap(obj())
  : StyleNode(obj)
);

const styleJoin = (sep, val1, val2) =>
  !val1 ? val2 : !val2 ? val1 : val1 + sep + val2;
const styleCombinator = (key, val1, val2) => {
  switch (key) {
    case 'transform':    return styleJoin('', val1, val2);
    case 'filter':       return styleJoin(' ', val1, val2);
    default:             return val2;
  }
}

const combinedStyle = nodes => nodes.reduce((obj, node) => {
  node.init();
  const style = node.updates.style?.() ?? node.style ?? {};
  for (const [k, v] of Object.entries(style))
    obj[k] = styleCombinator(k, obj[k], v);
  return obj;
}, {});

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
  Media: (queryStr, ...args) =>
    unwrap(args).map(node => node.fork(function() {
      this.media = node.media ? node.media + ' and ' + queryStr : queryStr;
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
      for (const node of nodes) node.init();
      const keys = Object.keys(combinedStyle(nodes));
      this.classname = '𝕋(' + ID('transition', param + keys.join(',')) + ')';
      this.style = {
        transition: keys.map(k => param + ' ' + kebab(k)).join(',')
      };
    }));
  },
  Animation: (param, keyframes) => [new Node(function(esc) {
    const str = Object.entries(keyframes).map(([ident, nodes]) => {
      nodes = unwrap(nodes);
      for (const node of nodes) node.init();
      const style = combinedStyle(nodes);
      return ident + '% ' + styleStr(style, false);
    }).join('\n');
    const kfId = ID('keyframes', str);
    const aId = ID('animation', param + kfId);
    this.classname = '𝔸(' + aId + ')';
    this.rules = [`@keyframes 𝔸${kfId} {\n${str}\n}`];
    this.style = { animation: param + ' 𝔸' + kfId };
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

const Processor = ({ addStyle, addClass, removeClass, esc }) => {
  const style = document.createElement('style');
  document.head.appendChild(style);

  const processedRules = new Set();
  let p;
  const insertRule = rule => {
    if (processedRules.has(rule)) return;
    processedRules.add(rule);
    p ??= Promise.resolve().then(() => {
      style.textContent = [...processedRules].join('\n');
      p = null;
    });
  }

  const processedNodes = {};
  const process = (elem, nodes) => {
    //console.log('\n\nprocess elem', { elem, nodes });
    for (const node of nodes) {
      node.init();
      const prevCls = node.cls;
      if (node.inline) addStyle(elem, node.style);
      else {
        if (!processedNodes[node.cls]) {
          for (const rule of node.css()) insertRule(rule);
          processedNodes[node.cls] = node
        }
        if (prevCls && node.cls != prevCls) removeClass?.(elem, prevCls);
        addClass(elem, node.cls);
      }
    }
  }
  const recalculate = () => {
    style.textContent.replaceSync('');
    processedRules.clear();
    for (const node of Object.values(processedNodes)) {
      node.update(esc);
      for (const rule of node.css()) insertRule(rule);
    }
  }

  return { process, recalculate }
}

export const Adapter = (options) => ({ methods, enumerate=false }) => {
  const { wrapper, addClass, addStyle, removeClass } = options;
  const { process, recalculate } = Processor({
    addStyle, addClass, removeClass,
    esc: enumerate ? d => 'v' + ID('', d) : escape
  });
  const wrap = (nodes) => wrapper(nodes, process);
  const v = Stack(wrap, methods);
  return { v, recalculate };
}
