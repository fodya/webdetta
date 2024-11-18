import Builder from '../common/builder.js';
import { r } from '../reactivity/index.js';
import { ref } from './operators.js';
import { builder, Element, Component } from './dom.js';

const listRoot = Symbol('List.root');
const createList = ({
  rootEl,
  itemsFn,
  elemKey=(item, i, arr)=>i,
  dataKey=(item, i, arr)=>i,
  render,
}) => {
  render = Component(render);

  const data = {};
  const elems = { [listRoot]: rootEl };
  const llistNext = { [listRoot]: undefined };
  const llistPrev = { [listRoot]: undefined };

  const connectItem = (k) => {
    elems[k] ??= render(data[k], k);
  }
  const moveItem = (k, nextK) => {
    llistNext[k] = nextK;
    llistPrev[nextK] = k;
    elems[k].after(elems[nextK]);
  }
  const resetItem = (k) => {

  }
  const disconnectItem = (k) => {
    const [prev, next] = [llistPrev[k], llistNext[k]];
    if (prev) llistNext[prev] = next;
    if (next) llistPrev[next] = prev;
    delete llistPrev[k];
    delete llistNext[k];

    delete data[k];
    elems[k].remove();
    delete elems[k];
  }

  let prevKeys = new Set();
  let prevDataKeys = [];
  const updateKeys = (keys, dataKeys) => {
    const currKeys = new Set(keys);
    for (const k of prevKeys) if (!currKeys.has(k))
      disconnectItem(k);
    for (const k of keys) if (!prevKeys.has(k))
      connectItem(k);
    for (let i = 0, l = keys.length; i < l; i++) {
      const k = i == 0 ? listRoot : keys[i - 1];
      const nextK = keys[i];
      if (llistNext[k] != nextK || llistPrev[nextK] != k)
        moveItem(k, nextK);
      if (i < prevDataKeys.length && prevDataKeys[i] != dataKeys[i])
        resetItem(k);
    }
    prevKeys = currKeys;
    prevDataKeys = dataKeys;
  }

  const updateItems = (list=[]) => {
    const keys = [];
    const dataKeys = []
    for (let i = 0, l = list.length; i < l; i++) {
      const item = list[i];
      const key = elemKey(item, i, list);
      data[key] ??= item;
      keys.push(key);
      dataKeys.push(dataKey(item, i, list));
    }
    updateKeys(keys, dataKeys);
  };

  r.effect(() => updateItems(itemsFn()));
}

export const list = (itemsFn, render) => Element('')(
  ref(dom => createList({ rootEl: dom, itemsFn, render }))
);

const if_ = (func, elem) => Element('')(ref((root) => {
  const dom = typeof elem == 'function' && elem[builder] === undefined
    ? Component(elem)()
    : elem;
  const update = (val) => {
    if (val) { root.after(dom); root.remove(); }
    else { dom.after(root); dom.remove(); }
  }
  r.effect(() => update(func()));
}));
export { if_ as 'if' };
