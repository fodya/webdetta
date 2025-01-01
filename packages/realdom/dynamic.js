import { unwrapFn } from '../common/utils.js';
import { r } from '../reactivity/index.js';
import { Element, Operator } from './dom.js';
import { performUndo } from './operators.js';

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

  const data = {};
  const elems = { [lRoot]: listNodeWrapper(root) };
  const lNext = { [lRoot]: undefined };
  const lPrev = { [lRoot]: undefined };

  const connectItem = (k) => {
    if (elems[k]) return;
    elems[k] = listNodeWrapper(renderItem(data[k], k));
  }
  const moveItem = (k, nextK) => {
    lNext[k] = nextK;
    lPrev[nextK] = k;
    elems[nextK].insertAfter(elems[k].lastNode);
  }
  const disconnectItem = (k) => {
    const prev = lPrev[k];
    const next = lNext[k];
    if (prev) lNext[prev] = next;
    if (next) lPrev[next] = prev;

    delete lPrev[k];
    delete lNext[k];
    delete data[k];

    elems[k].remove();
    delete elems[k];
  }

  let prevKeys = new Set();
  const updateKeys = (keys) => {
    const currKeys = new Set(keys);
    for (const k of prevKeys) if (!currKeys.has(k)) disconnectItem(k);
    for (const k of keys) if (!prevKeys.has(k)) connectItem(k);
    for (let i = 0, l = keys.length; i < l; i++) {
      const k = i == 0 ? lRoot : keys[i - 1];
      const nextK = keys[i];
      if (lNext[k] != nextK || lPrev[nextK] != k) moveItem(k, nextK);
    }
    prevKeys = currKeys;
  }

  const updateItems = (list=[]) => {
    const keys = [];
    for (let i = 0, l = list.length; i < l; i++) {
      const item = list[i];
      const key = keyFn(item, i, list);
      data[key] ??= item;
      keys.push(key);
    }
    updateKeys(keys);
  };

  const entriesToItems = (entries) => entries.map(([key, val]) =>
    typeof val == 'object' ? { key: val.key ?? key, ...val } : val
  );
  r.effect(() => {
    let items = unwrapFn(itemsFn);
    if (Array.isArray(items))
      items = items;
    else if (typeof items[Symbol.iterator] === 'function')
      items = entriesToItems(Array.from(items.entries()));
    else if (typeof items == 'object')
      items = entriesToItems(Object.entries(items));
    updateItems(items);
  });

  return () => {
    for (const k of prevKeys) disconnectItem(k);
    prevKeys.clear();
  }
}

export const appendItems = (node, items) => {
  const parentNode = node.parentNode;
  const children = [], operators = [];
  for (const item of items.flat(Infinity)) {
    if (Operator.isOperator(item)) operators.push(item);
    else children.push(Element.from(item))
  }

  const undo = [];
  for (const op of operators) undo.push(Operator.apply(parentNode, op));
  for (const dom of children) parentNode.insertBefore(dom, node);

  return () => {
    performUndo(undo);
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
