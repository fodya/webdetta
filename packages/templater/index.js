const Node = (operator, args) => ({ operator, args });

const parse = (str, config) => {
  const { operator, open, close, separator } = config;

  let buf = '', node = Node(null, []);
  const parents = new WeakMap();

  const strip = (suffix) => buf.slice(0, -suffix.length);
  const push = (arg) => node.args.push(arg);

  for (const c of str) {
    buf += c;
    if (buf.endsWith(operator)) {
      push(strip(operator));
      const parent = node;
      node = Node(null, [])
      parent.args.push(node);
      parents.set(node, parent);
      buf = '';
    }
    else if (buf.endsWith(open)) {
      node.operator = strip(open);
      buf = '';
    }
    else if (buf.endsWith(separator)) {
      push(strip(separator));
      buf = '';
    }
    else if (buf.endsWith(close)) {
      push(strip(close));
      node = parents.get(node);
      buf = '';
    }
  }

  push(buf);

  return node;
}

const flattenCtx = (ctx, prefix='', res={}) => {
  for (const [key, val] of Object.entries(ctx)) {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      flattenCtx(val, prefix + key + '.', res);
    } else {
      res[prefix + key] = val;
    }
  }
  return res;
}

const TemplateEngine = (config) => {
  const operators = {};

  const register = (name, func) => { operators[name] = func; }

  const _render = (node, ctx) => {
    if (typeof node == 'string') return node;
    if (Array.isArray(node)) return node.map(item => _render(item, ctx)).join('');
    ctx = flattenCtx(ctx);
    if (node.operator != null) return operators[node.operator](ctx, node.args, _render);
    return _render(node.args, ctx);
  }

  const render = (str, ctx) => _render(parse(str, config), ctx);

  return { register, render };
}

export default TemplateEngine;