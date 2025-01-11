import { Context } from '../common/context.js';
import { unwrapFn, once } from '../common/utils.js';
import { r } from '../reactivity/index.js';
import { Element, Operator } from './dom.js';
import { recurrent } from './operators.js';

const ctx = Context();
export const onRemove = f => ctx()?.onRemove.push(f);
const removable = func => {
  const onRemove = [];
  ctx.run({ onRemove }, func);
  return once(() => { for (const f of onRemove) f(); });
}

const nodeWrapper = node => {
  const isFragment = node.nodeType === 11;
  const children = isFragment ? Array.from(node.childNodes) : [node];
  const lastNode = isFragment ? children[children.length - 1] : node;
  const remove = () => {
    for (const item of children) item.remove();
    // put removed nodes back into fragment
    if (isFragment) node.append(...children);
  }
  const after = (...nodes) => lastNode.after(...nodes);
  return { children, after, remove };
}

const lRoot = Symbol();
const defaultKeyFn = (d, i) => (
  typeof d == 'number' || typeof d == 'string'
  ? d
  : d?.key ?? d?.id
) ?? i;
export const createList = (
  node,
  itemsFn,
  renderItem,
  keyFn=defaultKeyFn
) => {
  const root = document.createTextNode('');
  node.appendChild(root);

  const elems = new Map();
  elems.set(lRoot, nodeWrapper(root));
  const connect = (k, v) => elems.set(k, nodeWrapper(renderItem(v, k)));
  const move = (prevK, k) => elems.get(prevK).after(...elems.get(k).children);
  const disconnect = (k) => (elems.get(k).remove(), elems.delete(k));

  recurrent(() => {
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
}

export const createDynamicFragment = (node, content) => {
  const root = document.createTextNode('');
  node.appendChild(root);

  const appendItems = (items) => {
    const nodes = [];
    for (const item of [items].flat(Infinity)) {
      if (Operator.isOperator(item)) Operator.apply(node, item);
      else nodes.push(nodeWrapper(Element.from(item)));
    }
    let last = nodeWrapper(root);
    for (const wrapped of nodes) {
      last.after(...wrapped.children);
      last = wrapped;
    }
    onRemove(() => {
      for (const wrapped of nodes) wrapped.remove();
    });
  }

  let value;
  let removeItems;
  recurrent(() => {
    const newValue = content();
    if (value == newValue) return;
    removeItems?.();
    if (value = newValue) removeItems = removable(() => appendItems(value));
  });

  onRemove(() => removeItems?.());
}
