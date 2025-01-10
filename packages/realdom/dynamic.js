import { Context } from '../common/context.js';
import { unwrapFn } from '../common/utils.js';
import { r } from '../reactivity/index.js';
import { Element, Operator } from './dom.js';

const ctx = Context();
export const onRemove = f => ctx()?.onRemove.push(f);
export const onDestroy = f => ctx()?.onDestroy.push(f);

const listNodeWrapper = node => {
  const isFragment = node.nodeType === 11;
  const children = isFragment ? [...node.childNodes] : [node];
  const lastNode = children.at(-1);
  const remove = () => { for (const item of children) item.remove(); }
  const insertAfter = (refNode) => refNode.after(...children);
  return { lastNode, insertAfter, remove };
}

const lRoot = Symbol();
const defaultKeyFn = (d, i) => d?.key ?? d?.id ?? i;
export const createList = (
  node,
  itemsFn,
  renderItem,
  keyFn=defaultKeyFn
) => {
  const root = document.createTextNode('');
  node.appendChild(root);

  const elems = new Map();
  elems.set(lRoot, listNodeWrapper(root));
  const connect = (k, v) => elems.set(k, listNodeWrapper(renderItem(v, k)));
  const move = (prevK, k) => elems.get(k).insertAfter(elems.get(prevK).lastNode);
  const disconnect = (k) => (elems.get(k).remove(), elems.delete(k));

  r.effect(() => {
    const items = unwrapFn(itemsFn);
    const entries = (
      Array.isArray(items)
      ? items.map((d, i, a) => [keyFn(d, i, a), d])
      : typeof items[Symbol.iterator] === 'function'
      ? Array.from(items.entries())
      : typeof items == 'object'
      ? Object.entries(items)
      : null
    );

    const currKeys = new Set(entries.map(d => d[0]));
    currKeys.add(lRoot);
    for (const k of elems.keys()) {
      if (!currKeys.has(k)) disconnect(k);
    }
    let prevK = lRoot;
    for (const [k, v] of entries) {
      if (!elems.has(k)) connect(k, v);
      move(prevK, k);
      prevK = k;
    }
  });

  return () => {
    for (const k of Object.keys(elems)) disconnect(k);
  }
}

export const appendItems = (node, items) => {
  const children = [], operators = [];
  for (const item of items.flat(Infinity)) {
    if (Operator.isOperator(item)) operators.push(item);
    else children.push(Element.from(item))
  }

  const parentNode = node.parentNode;
  const onRemove = [], onDestroy = [];
  ctx.run({ onRemove, onDestroy }, () => {
    for (const op of operators) Operator.apply(parentNode, op);
  });
  node.after(...children);

  return () => {
    for (const f of onRemove) f();
    for (const dom of children) dom.remove();
  }
}

export const createIf = (node, conditions) => {
  const root = document.createTextNode('');
  node.appendChild(root);

  let undo;
  let index = -1;
  r.effect(() => {
    const newIndex = conditions.findIndex(d => unwrapFn(d.cond));
    if (index == newIndex) return;
    const content = conditions[index = newIndex]?.args;
    undo?.();
    if (content) undo = appendItems(root, content);
  });
}
