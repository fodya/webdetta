const Node = (operator, args) => ({ operator, args, nested: 0 });

const OP_REGEX = /[a-zA-Z_]/;
const parse = (str, config) => {
  const { operator, open, close, separator } = config;

  const root = Node(null, []);
  const parents = new WeakMap();
  let buf = '', op = null, node = root;

  const strip = (suffix) => buf.slice(0, -suffix.length);
  const pushArg = (arg) => node.args.push(arg);
  const pushNode = (operator) => {
    const parent = node;
    node = Node(operator, [])
    parent.args.push(node);
    parents.set(node, parent);
  }

  for (const c of str) {
    buf += c;

    if (buf.endsWith(operator)) {
      pushArg(strip(operator));
      op = '';
      continue;
    }

    if (buf.endsWith(open)) {
      if (op != null) { pushNode(op); buf = ''; continue; }
      else node.nested++;
    }
    if (buf.endsWith(separator)) {
      if (node.nested == 0 && node != root) {
        pushArg(strip(separator));
        buf = ''; continue;
      }
    }
    if (buf.endsWith(close)) {
      if (node.nested-- == 0 && node != root) {
        pushArg(strip(close));
        node = parents.get(node);
      } else {
        pushArg(buf);
      }
      buf = ''; continue;
    }

    if (!OP_REGEX.test(c)) op = null;
    if (op != null) op += c;
  }

  pushArg(buf);

  return root;
}

const flattenCtx = (ctx, prefix = '', res = {}) => {
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