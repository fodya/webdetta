import { append } from './dom.js';
import { val, derived } from './reactive.js';
import Ctx from './ctx.js';
import { Chain } from 'webdetta/common/chain';

const listRoot = Symbol('List.root');
export const List = (items, {
  deallocator=({key, item, elem, ctx, finish}) => finish(),
  elemKey=(item, i, arr)=>i,
  dataKey=(item, i, arr)=>i,
  render,
}) => {
  if (!Chain.isChain(items)) {
    items = derived(items);
  }
  if (typeof elemKey != 'function') {
    const k = elemKey;
    elemKey = (item) => [k].flatMap(d => item()[d]).join('');
  }
  if (typeof dataKey != 'function') {
    const k = dataKey;
    dataKey = (item) => [k].flatMap(d => item()[d]).join('');
  }

  const data = {};
  const ctxs = { [listRoot]: null };
  const elems = { [listRoot]: document.createComment('listroot') };
  const llistNext = { [listRoot]: undefined };
  const llistPrev = { [listRoot]: undefined };

  const connectItem = (key) => {
    const frag = document.createDocumentFragment();
    ctxs[key].connected(true);
    ctxs[key].run(() => append(frag, render(data[key], key)));
    elems[key] = frag.childNodes[0];
  }
  const resetItem = (key) => {
    ctxs[key].reset();
  }
  const disconnectItem = (key) => {
    elems[key].remove();
    ctxs[key].connected(false);
    delete ctxs[key];
    delete elems[key];
    delete data[key];
  }

  let prevKeys = new Set();
  let prevDataKeys = {};
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
    for (const k of currKeys) if (!prevKeys.has(k)) {
      connectItem(k);
    }
    for (let i = 0; i < keys.length; i++) {
      const k = i == 0 ? listRoot : keys[i - 1];
      const nextK = keys[i];
      if (llistNext[k] != nextK || llistPrev[nextK] != k) {
        llistNext[k] = nextK;
        llistPrev[nextK] = k;
        elems[k].after(elems[nextK]);
      }
      if ((k in prevDataKeys) && prevDataKeys[k] != dataKeys[k]) {
        resetItem(k);
      }
    }
    prevKeys = currKeys;
    prevDataKeys = dataKeys;
  }

  items.on((list=[]) => {
    const dataKeys = {};
    const keys = list.map((item, i) => {
      const itemfn = () => item;
      const key = elemKey(itemfn, i, list);
      const ctx = ctxs[key] ??= Ctx.current().fork();
      dataKeys[key] = dataKey(itemfn, i, list);
      (data[key] ??= val())(item);
      return key;
    });
    updateKeys(keys, dataKeys);
  });
  return elems[listRoot];
}
