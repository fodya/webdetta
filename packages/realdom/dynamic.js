import { Context } from '../common/context.js';
import { unwrapFn, once } from '../common/utils.js';
import { r } from '../reactivity/index.js';
import { Element, Operator } from './dom.js';
import { recurrent } from './operators.js';

const onRemoveCtx = Context();
export const onRemove = (f) => onRemoveCtx()?.push(f);
const removable = func => {
  const onRemove = [];
  onRemoveCtx.run(onRemove, func);
  return once(() => { for (const f of onRemove) f(); });
}

const nodeWrapper = node => {
  const isFragment = node.nodeType === 11;
  const children = isFragment ? Array.from(node.childNodes) : [node];
  const lastNode = isFragment ? children.at(-1) : node;
  const remove = () => {
    // put removed nodes back into fragment. this will remove them from page
    if (isFragment) node.append(...children);
    else node.remove();
  }
  const after = (...nodes) => {
    lastNode.after(...nodes);
  }
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

  const elems = new Map([
    [lRoot, nodeWrapper(root)]
  ]);
  const prev = new Map();
  const next = new Map();

  const connect = (k, dom) => {
    elems.set(k, dom);
  }
  const move = (prevK, k) => {
    if (prev.get(k) == prevK && next.get(prevK) == k) return;
    prev.set(k, prevK);
    next.set(prevK, k);
    elems.get(prevK).after(...elems.get(k).children);
  }
  const disconnect = (k) => {
    const prevK = prev.get(k);
    const nextK = next.get(k);
    prev.set(nextK, prevK);
    next.set(prevK, nextK);
    prev.delete(k);
    next.delete(k);
    elems.get(k).remove();
    elems.delete(k);
  }

  recurrent(() => {
    const items = unwrapFn(itemsFn);
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
      if (!elems.has(k)) {
        const dom = renderItem(v, i, items);
        connect(k, nodeWrapper(dom));
      }
      move(prevK, k);
      prevK = k;
      i++;
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
