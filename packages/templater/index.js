const Node = (operator, args, parent) => ({ operator, args, nested: 0, parent });

const OP_REGEX = /[a-zA-Z_]/;
const parse = (str, config) => {
  const { operatorSymbol, openBracket, closeBracket, argumentsSeparator } = config;

  const root = Node(null, [], null);
  let buf = '', op = null, node = root;

  const strip = (suffix) => buf.slice(0, -suffix.length);
  const pushArg = (arg) => node.args.push(arg);
  const pushNode = (operator) => {
    const parent = node;
    const child = Node(operator, [], parent);
    parent.args.push(child);
    node = child;
  }

  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    buf += c;

    if (c == operatorSymbol) {
      const nextC = str[i + 1];
      if (nextC == operatorSymbol) continue;
      pushArg(strip(operatorSymbol));
      op = '';
      continue;
    }

    if (buf.endsWith(openBracket)) {
      if (op != null) { pushNode(op); buf = ''; continue; }
      else node.nested++;
    }
    if (buf.endsWith(argumentsSeparator)) {
      if (node.nested == 0 && node != root) {
        pushArg(strip(argumentsSeparator));
        buf = ''; continue;
      }
    }
    if (buf.endsWith(closeBracket)) {
      if (node.nested-- == 0 && node != root) {
        pushArg(strip(closeBracket));
        node = node.parent;
        buf = ''; continue;
      }
      if (op != null) {
        pushArg(buf);
        buf = ''; continue;
      }
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

const Templater = (config) => {
  const operators = {};

  const _renderArray = (args, ctx) => {
    let res = '';
    let sep = false;
    for (const arg of args) {
      if (typeof arg == 'string') {
        res += (sep ? config.argumentsSeparator : '') + arg;
        sep = true;
      } else {
        res += _render(arg, ctx);
        sep = false;
      }
    }
    return res;
  }
  const _render = (node, ctx) => {
    if (typeof node == 'string') return node;

    ctx = flattenCtx(ctx);
    if (Array.isArray(node)) return _renderArray(node, ctx);

    if (node.operator != null) {
      const operator = operators[node.operator];
      if (!operator) throw new Error(`Unknown operator: ${node.operator}`);
      return operator(ctx, node.args, _render);
    }

    return _renderArray(node.args, ctx);
  }

  const res = {};
  res.register = (name, func) => { operators[name] = func; }
  res.parse = (str) => parse(str, config);
  res.render = (str, ctx) => _render(res.parse(str), ctx);
  return res;
}

export { Templater };