import Builder from '../common/builder.js';
import { Context } from '../common/context.js';
import { unwrapFn } from '../common/utils.js';
import { r } from '../reactivity/index.js';
import { Element, Component, initializing, render, hydrate } from './dom.js';

export const lifecycle = Context();
const Lifecycle = () => {
  let started = false;
  const onStart = [], onStop = [];
  let self; return self = {
    onStart: h => onStart.push(h),
    onStop: h => onStop.push(h),
    start: () => lifecycle.run(self, () => {
      if (started) return;
      started = true;
      const arr = [...onStart];
      onStop.length = onStart.length = 0;
      for (const h of arr) h();
    }),
    stop: () => lifecycle.run(self, () => {
      if (!started) return;
      started = false;
      for (const h of onStop) h();
    })
  };
}

const listRoot = Symbol('List.root');
const createList_ = ({
  root,
  itemsFn,
  elemKey=(item, i, arr)=>i,
  dataKey=(item, i, arr)=>i,
  renderItem,
}) => {
  renderItem = Component(renderItem);

  const data = {};
  const elems = { [listRoot]: root };
  const llistNext = { [listRoot]: undefined };
  const llistPrev = { [listRoot]: undefined };

  const connectItem = (k) => {
    if (elems[k]) return elems[k];
    const elem = renderItem(data[k], k);
    elems[k] = elem instanceof Node ? elem : render(elem);
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

  r.effect(() => updateItems(unwrapFn(itemsFn)));
}

export const createList = (root, itemsFn, renderItem) =>
  createList_({ root, itemsFn, renderItem });

export const appendItems = (parentNode, node, items) => {
  const children = [], operators = [];
  const process = initializing.bind(null, item => {
    const builder = item[Builder.symbol];
    if (builder === 1) children.push(render(item));
    else if (builder === 2) operators.push(item);
    else if (typeof item === 'function') process(item());
    else if (Array.isArray(item)) item.forEach(process);
    else if (item instanceof Node) children.push(item);
    else children.push(render(Element.from(item)))
  });
  process(items);

  initializing.run(null, () => {
    for (const op of operators) hydrate(parentNode, op);
    for (const dom of children) parentNode.insertBefore(dom, node);
    lifecycle()?.onStop(() => {
      for (const dom of children) dom.remove();
    });
  });
}

export const createIf = (root, conditions) => {
  const parentNode = root.parentNode;
  const { start, stop, onStart, onStop } = Lifecycle();
  let index = -1;
  r.effect(initializing.bind(null, () => {
    const newIndex = conditions.findIndex(d => unwrapFn(d.cond));
    if (index == newIndex) return;
    const content = conditions[index = newIndex]?.args;
    stop();
    if (content) onStart(() => appendItems(parentNode, root, content));
    start();
  }));
}
