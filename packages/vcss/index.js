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

const NODES = Symbol('VENDETTA_NODES');
export const inspect = obj => {
  if (typeof obj != 'function' && typeof obj != 'object') return null;
  const wrapped = obj && NODES in obj;
  return wrapped ? inspect(obj[NODES]) : obj;
}

const nodeDefaults = [
  ['selector', ''],
  ['media', ''],
  ['important', false],
  ['inline', false],
  ['classname', null],
  ['rules', null],
  ['style', null]
];

class Node {
  constructor(data) {
    this.updates = {};
    for (const [k, v] of nodeDefaults) {
      const val = data[k] ?? v;
      if (typeof val == 'function') this.updates[k] = val;
      this[k] = unwrapfn(val);
    }
    this.cls = this._cls();
  }
  _cls() {
    return escape([
      this.media && '𝕄(' + this.media + ')',
      this.selector && '𝕊(' + this.selector + ')',
      this.classname,
      this.important && 'ǃ'
    ].filter(v => v).join(''));
  }
  recalculate() {
    for (const [k, f] of Object.entries(this.updates)) this[k] = unwrapfn(f);
    this.cls = this._cls();
  }
  css() {
    const sel = selectorTmpl(this.selector, '.' + this.cls);
    const str = sel + styleStr(this.style, this.important);
    return [
      ...(this.rules ?? []),
      this.media ? `@media ${this.media} {${str}}` : str
    ];
  }
}

const nodeWithArgs = (args, argsmap, func) => {
  let obj;
  const recalc = () => {
    if (obj) return obj;
    setTimeout(() => { obj = null });
    return obj = func(argsmap(args));
  }
  return new Node({
    classname: () => (recalc().classname),
    style: () => (recalc().style)
  });
}
const StyleNode = (...args) =>
  nodeWithArgs(args, (args) => args.map(unwrapfn), (args) => (
    args.length == 1
    ? { classname: 'CSS(' + JSON.stringify(args[0]) + ')', style: args[0] }
    : { classname: args[0], style: args[1] }
  ));
const MethodNode = (methods, name, args) =>
  nodeWithArgs(args, processMethodArgs, (args) => ({
    classname: name + '(' + args.join(',') + ')',
    style: methods[name](...args)
  }));

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
  const style = node.updates.style?.() ?? node.style ?? {};
  for (const [k, v] of Object.entries(style))
    obj[k] = styleCombinator(k, obj[k], v);
  return obj;
}, {});

const operators = {
  Sel: (selStr, ...args) => {
    const nodes = unwrap(args);
    return splitSelector(selStr).flatMap(selStr =>
      nodes.map(node => new Node({
        ...node,
        selector: node.selector ? selectorTmpl(selStr, node.selector) : selStr
      }))
    );
  },
  Media: (queryStr, ...args) => unwrap(args).map(node => new Node({
    ...node,
    media: node.media ? node.media + ' and ' + queryStr : queryStr
  })),
  Important: (...args) => unwrap(args).map(node => new Node({
    ...node,
    important: true
  })),
  Inline: (...args) => unwrap(args).map(node => new Node({
    ...node,
    inline: true
  })),
  Transition: (param, ...args) => {
    const nodes = unwrap(args);
    const keys = () => Object.keys(combinedStyle(nodes));
    return nodes.concat(new Node({
      classname: () => '𝕋(' + ID('transition', param + keys().join(',')) + ')',
      style: () => ({
        transition: keys().map(k => param + ' ' + kebab(k)).join(',')
      })
    }));
  },
  Animation: (param, keyframes) => {
    const str = () =>
      Object.entries(keyframes).map(([ident, nodes]) => {
        const style = combinedStyle(unwrap(nodes));
        return ident + '% ' + styleStr(style, false);
      }).join('\n');
    const kfId = ID('keyframes', str());
    const aId = ID('animation', param + kfId)
    return [new Node({
      classname: () => '𝔸(' + aId + ')',
      rules: () => [`@keyframes 𝔸${kfId} {\n${str()}\n}`],
      style: () => ({ animation: param + ' 𝔸' + kfId })
    })];
  },
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
      has: (_, name) => name == NODES || name in methods || name in operators || name in res,
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

const Processor = ({ addStyle, addClass }) => {
  const stylesheet = new CSSStyleSheet;
  document.adoptedStyleSheets.push(stylesheet);

  const processedRules = new Set();
  const insertRule = rule => {
    if (processedRules.has(rule)) return;
    processedRules.add(rule);
    stylesheet.insertRule(rule, stylesheet.cssRules.length);
  }

  const processedNodes = {};
  const process = (elem, nodes) => {
    //console.log('\n\nprocess elem', { elem, nodes });
    for (const node of nodes) {
      if (node.inline) addStyle(elem, node.style);
      else {
        if (!processedNodes[node.cls]) {
          for (const rule of node.css()) insertRule(rule);
          processedNodes[node.cls] = node
        }
        addClass(elem, node.cls);
      }
    }
  }
  const recalculate = () => {
    stylesheet.replaceSync('');
    processedRules.clear();
    for (const node of Object.values(processedNodes)) {
      node.recalculate();
      for (const rule of node.css()) insertRule(rule);
    }
  }

  return { process, recalculate, stylesheet }
}

export const Adapter = ({ wrapper, addClass, addStyle }) => methods => {
  const { process, recalculate, stylesheet } = Processor({ addStyle, addClass });
  const wrap = (nodes) => wrapper(nodes, process);
  const v = Stack(wrap, methods);
  return { v, recalculate, stylesheet };
}
