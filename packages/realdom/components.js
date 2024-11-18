import Builder from '../common/builder.js';
import { r } from '../reactivity/index.js';
import { ref } from './operators.js';
import { builder, Element, Component } from './dom.js';

const listRoot = Symbol('List.root');
const createList = ({
  rootEl,
  state,
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

  const connectItem = (key) => {
    elems[key] ??= render(data[key], key);
  }
  const resetItem = (key) => {
  }
  const disconnectItem = (key) => {
    delete data[key];
    elems[key].remove();
    delete elems[key];
  }

  let prevKeys = new Set();
  let prevDataKeys = [];
  const updateKeys = (keys, dataKeys) => {
    const currKeys = new Set(keys);
    for (const k of prevKeys) if (!currKeys.has(k)) {
      const [prev, next] = [llistPrev[k], llistNext[k]];
      if (prev) llistNext[prev] = next;
      if (next) llistPrev[next] = prev;
      delete llistPrev[k];
      delete llistNext[k];
      disconnectItem(k);
    }
    for (const k of keys) if (!prevKeys.has(k)) {
      connectItem(k);
    }
    for (let i = 0, l = keys.length; i < l; i++) {
      const k = i == 0 ? listRoot : keys[i - 1];
      const nextK = keys[i];
      if (llistNext[k] != nextK || llistPrev[nextK] != k) {
        llistNext[k] = nextK;
        llistPrev[nextK] = k;
        elems[k].after(elems[nextK]);
      }
      if (i < prevDataKeys.length && prevDataKeys[i] != dataKeys[i]) {
        resetItem(k);
      }
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
  ref((dom, state) => createList({
    rootEl: dom,
    state,
    itemsFn,
    render
  }))
);

const if_ = (func, elem) => Element('')(ref((dom) => {
  const f = typeof elem == 'function' && elem[builder] === undefined;
  const root = dom;
  const eldom = Component(() => f ? elem() : elem)();
  const update = (val) => {
    if (val) {
      root.after(eldom);
      root.remove();
    } else {
      eldom.after(root);
      eldom.remove();
    }
  }
  r.effect(() => update(func()));
}));
export { if_ as 'if' };
