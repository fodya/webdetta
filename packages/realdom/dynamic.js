import { Context } from '../common/context.js';
import { unwrapFn } from '../common/utils.js';
import { r } from '../reactivity/index.js';
import { Element, Operator } from './dom.js';
import { recurrent } from './operators.js';

const domHandlers = () => {
  const map = new WeakMap();
  const on = (dom, f) => {
    let list = map.get(dom);
    if (!list) map.set(dom, list = []);
    list.push(f);
  }
  const trigger = (dom) => {
    const list = map.get(dom);
    if (!list) return;
    for (const f of list) f();
  }
  return { on, trigger };
}

export const domAppend = domHandlers();
export const domRemove = domHandlers();

const operatorDisableCtx = Context();
export const onOperatorDisable = (f) => operatorDisableCtx()?.push(f);

const isFragment = node => node.nodeType === 11;

const lRoot = Symbol();
const defaultKeyFn = (d, i) => (
  typeof d == 'number' || typeof d == 'string'
  ? d
  : d?.key ?? d?.id
) ?? i;
export const createList = (
  itemsFn,
  renderItem,
  keyFn=defaultKeyFn
) => {
  const root = document.createTextNode('');

  const elems = new Map([[lRoot, root]]);
  const scopes = new Map();
  const prev = new Map();
  const next = new Map();

  const connect = (k, func) => {
    const scope = r.scope(func);
    scopes.set(k, scope);
    elems.set(k, scope());
  }
  const move = (prevK, k) => {
    const nextK = next.get(prevK);
    if (prev.get(k) === prevK && nextK === k) return;
    prev.set(k, prevK);
    next.set(prevK, k);
    prev.set(nextK, k);
    next.set(k, nextK);
    Element.append({ after: elems.get(prevK) }, elems.get(k));
  }
  const disconnect = (k) => {
    const prevK = prev.get(k);
    const nextK = next.get(k);
    prev.set(nextK, prevK);
    next.set(prevK, nextK);
    prev.delete(k);
    next.delete(k);
    scopes.get(k).abort();
    scopes.delete(k);
    Element.remove(elems.get(k));
    elems.delete(k);
  }

  const attached = r.val(false);
  recurrent(() => {
    const items = unwrapFn(itemsFn);
    if (!attached()) {
      for (const k of elems.keys()) if (k != lRoot) disconnect(k);
      return;
    }

    const entries = new Map(
      Array.isArray(items)
      ? items.map((d, i, a) => [keyFn(d, i, a), d])
      : typeof items[Symbol.iterator] === 'function'
      ? Array.from(items.entries())
      : typeof items == 'object'
      ? Object.entries(items)
      : null
    );

    for (const k of elems.keys())
      if (k != lRoot && !entries.has(k))
        disconnect(k);

    let prevK = lRoot;
    let i = 0;
    for (const [k, v] of entries) {
      if (!elems.has(k)) connect(k, () => renderItem(v, i, items, k));
      move(prevK, k);
      prevK = k;
      i++;
    }
  });
  domAppend.on(root, () => !attached() && attached(true));
  domRemove.on(root, () => attached() && attached(false));

  return root;
}

export const createSlot = (content) => {
  const node = document.createTextNode('');
  const attached = r.val(false);

  const children = [], operators = [], operatorsDisable = [];
  const setItems = items => {
    children.length = operators.length = operatorsDisable.length = 0;
    if (!items) return;
    for (const item of [items].flat(Infinity)) {
      if (Operator.isOperator(item)) {
        operators.push(item);
      } else {
        const node = Element.from(item);
        children.push(...(isFragment(node) ? node.childNodes : [node]))
      }
    }
  }

  const append = () => {
    const parentNode = node.parentNode;
    let last = node;
    for (const child of children) {
      Element.append({ after: last }, child);
      last = child;
    }
    operatorDisableCtx.run(operatorsDisable, () => {
      for (const item of operators) Operator.apply(parentNode, item);
      operators.length = 0;
    });
  }

  let lastContent;
  const remove = () => {
    lastContent = null;
    for (const child of children) Element.remove(child);
    for (const f of operatorsDisable) f();
    children.length = operators.length = operatorsDisable.length = 0;
  }

  recurrent(() => {
    const newContent = content();
    if (!attached()) { remove(); return; }
    if (lastContent == newContent) return;
    remove();
    setItems(lastContent = newContent);
    append();
  });

  domAppend.on(node, () => !attached() && attached(true));
  domRemove.on(node, () => attached() && attached(false));

  return node;
}

export const createIf = () => {
  const conditions = r.val([]);
  const content = r.val(null);
  const node = createSlot(content);
  
  r.effect(() => content(
    conditions().find(d => unwrapFn(d.cond))?.args
  ));

  node.elif = (cond, ...args) => {
    const list = conditions();
    list.push({ cond, args });
    conditions(list);
    return node;
  }
  node.else = (...args) => {
    node.elif(true, ...args);
    delete node.elif;
    delete node.else;
    return node;
  }

  return node;
}
