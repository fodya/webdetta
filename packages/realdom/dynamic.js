import { unwrapFn } from '../common/utils.js';
import { r } from '../reactivity/index.js';
import { Element, Operator, processItem } from './base.js';

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
  return [on, trigger];
}

export const [onDomAppend, domAppendTrigger] = domHandlers();
export const [onDomRemove, domRemoveTrigger] = domHandlers();

const listRoot = Symbol();
const listKenFnDefault = (d, i) => {
  if (typeof d == 'number' || typeof d == 'string') return d;
  if (d) {
    if ('key' in d) return d.key;
    if ('id' in d) return d.id;
  }
  return i;
};
const listItemsToEntries = (items, keyFn) => new Map(
  Array.isArray(items)
  ? items.map((d, i, a) => [keyFn(d, i, a), d])
  : typeof items[Symbol.iterator] === 'function'
  ? Array.from(items.entries())
  : typeof items == 'object'
  ? Object.entries(items)
  : null
)
export const createList = (
  itemsFn,
  renderItem,
  keyFn=listKenFnDefault
) => {
  const root = document.createTextNode('');

  const elements = new Map([[listRoot, root]]);
  const effects = new Map();
  const prev = new Map();
  const next = new Map();

  const connect = (k, func) => {
    let dom;
    const effect = r.untrack(() => dom = func());
    effects.set(k, effect);
    elements.set(k, dom);
  }
  const move = (prevK, k) => {
    const nextK = next.get(prevK);
    if (prev.get(k) === prevK && nextK === k) return;
    prev.set(k, prevK);
    next.set(prevK, k);
    prev.set(nextK, k);
    next.set(k, nextK);
    Element.appendAfter(elements.get(prevK), elements.get(k));
  }
  const disconnect = (k) => {
    const prevK = prev.get(k);
    const nextK = next.get(k);
    prev.set(nextK, prevK);
    next.set(prevK, nextK);
    prev.delete(k);
    next.delete(k);
    effects.get(k).destroy();
    effects.delete(k);
    Element.remove(elements.get(k));
    elements.delete(k);
  }

  const attached = r.dval(false);
  r.effect(() => {
    if (!attached()) {
      for (const k of elements.keys()) if (k != listRoot) disconnect(k);
      return;
    }
    
    const items = unwrapFn(itemsFn);
    const entries = listItemsToEntries(items, keyFn);

    for (const k of elements.keys()) {
      if (k != listRoot && !entries.has(k)) {
        disconnect(k);
      }
    }

    let prevK = listRoot;
    let i = 0;
    for (const [k, v] of entries) {
      if (!elements.has(k)) connect(k, () => renderItem(v, i, items, k));
      move(prevK, k);
      prevK = k;
      i++;
    }
  });
  onDomAppend(root, () => attached(true));
  onDomRemove(root, () => attached(false));

  return root;
}

export const createSlot = (content) => {
  const node = document.createTextNode('');
  const attached = r.dval(false);

  let nodes = [];
  const append = (content) => {
    if (!content) return;
    nodes = [];
    let last = node;
    processItem(content,
      op => {
        Operator.apply(node.parentNode, op);
      },
      child => {
        Element.appendAfter(last, child);
        nodes.push(last = child);
      },
      true
    );
  };

  const remove = () => {
    if (!nodes) return;
    for (const child of nodes) Element.remove(child);
    nodes = null;
  }

  r.effect(() => {
    remove();
    if (!attached()) return;
    append(content());
  });

  onDomAppend(node, () => attached(true));
  onDomRemove(node, () => attached(false));

  return node;
}

export const createIf = () => {
  const conditions = r.val([]);
  const content = r.computed(() => conditions().find(d => unwrapFn(d.cond))?.args);
  
  const node = createSlot(content);
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

export const createDynamic = (argFn, renderFn) => {
  const content = r.val();
  let controller;
  r.effect(() => {
    const arg = argFn();
    controller?.destroy();
    controller = r.untrack(() => {
      content(renderFn(arg));
    });
  });
  return createSlot(content);
}