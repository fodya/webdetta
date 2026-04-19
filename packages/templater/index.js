// @ts-self-types="./types/index.d.ts"
import { isPlainObject } from '../common/utils.js';

const Node = (operator) => ({ operator, args: [], nested: 0 });

const OP_REGEX = /[a-zA-Z_]/;

const validateConfig = (config) => {
  if (!config || typeof config !== 'object') {
    throw new Error('Templater: config object is required');
  }
  const fields = ['operatorSymbol', 'openBracket', 'closeBracket', 'argumentsSeparator'];
  for (const f of fields) {
    const v = config[f];
    if (typeof v !== 'string' || v.length === 0) {
      throw new Error(`Templater: config.${f} must be a non-empty string`);
    }
  }
  if (config.openBracket === config.closeBracket) {
    throw new Error('Templater: openBracket and closeBracket must differ');
  }
};

const parse = (str, config, operators, onOperatorNotFound) => {
  const { operatorSymbol, openBracket, closeBracket, argumentsSeparator } = config;
  const opSymLen = operatorSymbol.length;
  const openLen = openBracket.length;
  const closeLen = closeBracket.length;
  const sepLen = argumentsSeparator.length;

  const bracketPrefixMatches = () => {
    for (let k = 1; k < openLen; k++) {
      if (buf.endsWith(openBracket.slice(0, k))) return true;
    }
    return false;
  };

  const root = Node(null);
  const stack = [];
  let node = root;
  let buf = '';
  let op = null;
  let opPhase = null;
  let opStart = -1;

  const resetOp = () => { op = null; opPhase = null; opStart = -1; };
  const pushArg = (arg) => {
    if (arg === '') return;
    node.args.push(arg);
  };
  const pushNode = (operator) => {
    const child = Node(operator);
    node.args.push(child);
    stack.push(node);
    node = child;
  };
  const popNode = () => { node = stack.pop() ?? root; };

  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    buf += c;

    if (buf.endsWith(operatorSymbol)) {
      opStart = buf.length - opSymLen;
      op = '';
      opPhase = 'id';
      continue;
    }

    if (op != null && buf.endsWith(openBracket)) {
      if (!(op in operators)) {
        onOperatorNotFound(op, node);
        node.nested++;
        resetOp();
        continue;
      }
      pushArg(buf.slice(0, opStart));
      pushNode(op);
      buf = '';
      resetOp();
      continue;
    }

    if (buf.endsWith(closeBracket)) {
      if (node.nested > 0) {
        node.nested--;
        continue;
      }
      if (node !== root) {
        pushArg(buf.slice(0, -closeLen));
        popNode();
        buf = '';
        resetOp();
        continue;
      }
    }

    if (buf.endsWith(argumentsSeparator) && node !== root && node.nested === 0) {
      pushArg(buf.slice(0, -sepLen));
      buf = '';
      resetOp();
      continue;
    }

    if (op == null && buf.endsWith(openBracket)) {
      node.nested++;
    }

    if (op != null) {
      if (opPhase === 'id' && OP_REGEX.test(c)) {
        op += c;
      } else {
        if (opPhase === 'id') opPhase = 'bracket';
        if (!bracketPrefixMatches()) resetOp();
      }
    }
  }
  pushArg(buf);
  return root;
};

const flatObjects = new WeakSet();
const hasNestedPlainObject = (ctx) => {
  if (flatObjects.has(ctx)) return false;
  for (const key in ctx) {
    if (isPlainObject(ctx[key])) return true;
  }
  flatObjects.add(ctx);
  return false;
};

const flattenCtx = (ctx, prefix = '', res = {}) => {
  for (const [key, val] of Object.entries(ctx)) {
    if (isPlainObject(val)) {
      flattenCtx(val, prefix + key + '.', res);
    } else {
      res[prefix + key] = val;
    }
  }
  if (prefix === '') flatObjects.add(res);
  return res;
};

const defaultOnOperatorNotFound = (op) => {
  console.warn(`Templater: operator "${op}" is not registered, treating as literal`);
};

const Templater = (config) => {
  validateConfig(config);
  const operators = {};
  const onOperatorNotFound = typeof config.onOperatorNotFound === 'function'
    ? config.onOperatorNotFound
    : defaultOnOperatorNotFound;

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
  };
  const _render = (node, ctx) => {
    if (typeof node == 'string') return node;
    if (hasNestedPlainObject(ctx)) ctx = flattenCtx(ctx);
    if (Array.isArray(node)) return _renderArray(node, ctx);

    if (node.operator != null) {
      const operator = operators[node.operator];
      if (!operator) throw new Error(`Unknown operator: ${node.operator}`);
      return operator(ctx, node.args, _render);
    }
    return _renderArray(node.args, ctx);
  };

  const res = {};
  res.register = (name, func) => { operators[name] = func; };
  res.parse = (str) => parse(str, config, operators, onOperatorNotFound);
  res.render = (str, ctx) => _render(res.parse(str), ctx);
  return res;
};

export { Templater };
