import { unwrapFn } from '../common/utils.js';
import { r } from '../reactivity/index.js';
import { Element, Operator } from './dom.js';

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

const isFragment = node => node.nodeType === 11;

const initializeLazyElements = (list) => {
  if (list) for (let i = 0; i < list.length; i++) {
    // unwrap lazy elements:
    // el.if(condition, () => someLazyContent()) => rendered content
    const item = list[i];
    if (Element.isLazyElement(item)) list[i] = unwrapFn(item);
  }
}

const lRoot = Symbol();
const defaultKeyFn = (d, i) => {
  if (typeof d == 'number' || typeof d == 'string') return d;
  if (d?.key != null) return d.key;
  if (d?.id != null) return d.id;
  return i;
};
export const createList = (
  itemsFn,
  renderItem,
  keyFn=defaultKeyFn
) => {
  const root = document.createTextNode('');

  const elems = new Map([[lRoot, root]]);
  const aborts = new Map();
  const prev = new Map();
  const next = new Map();

  const connect = (k, func) => {
    let dom;
    const controller = r.detach(() => {
      dom = func();
    });
    aborts.set(k, controller.abort.bind(controller));
    elems.set(k, dom);
  }
  const move = (prevK, k) => {
    const nextK = next.get(prevK);
    if (prev.get(k) === prevK && nextK === k) return;
    prev.set(k, prevK);
    next.set(prevK, k);
    prev.set(nextK, k);
    next.set(k, nextK);
    Element.append(elems.get(prevK), elems.get(k), 'after');
  }
  const disconnect = (k) => {
    const prevK = prev.get(k);
    const nextK = next.get(k);
    prev.set(nextK, prevK);
    next.set(prevK, nextK);
    prev.delete(k);
    next.delete(k);
    aborts.get(k)();
    aborts.delete(k);
    Element.remove(elems.get(k));
    elems.delete(k);
  }

  const attached = r.dval(false);
  r.effect(() => {
    if (!attached()) {
      for (const k of elems.keys()) if (k != lRoot) disconnect(k);
      return;
    }
    
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
      if (!elems.has(k)) connect(k, () => renderItem(v, i, items, k));
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

  let abort = null;

  const append = (items) => {
    if (!items) return;
    const controller = r.detach(() => {
      const parentNode = node.parentNode;
      let last = node;
      for (const item of [items].flat(Infinity)) {
        if (Operator.isOperator(item)) Operator.apply(parentNode, item);
        else {
          const node = Element.from(item);
          const nodes = isFragment(node) ? node.childNodes : [node];
          for (const child of nodes) {
            Element.append(last, child, 'after');
            last = child;
          }
          Operator.onCleanup(() => {
            for (const child of nodes) Element.remove(child);
          });
        }
      }
    });
    abort = controller.abort.bind(controller);
  }

  let currentContent;
  const remove = () => {
    currentContent = null;
    abort?.(Operator.CLEANUP);
    abort = null;
  }

  r.effect(() => {
    if (!attached()) { remove(); return; }
    const newContent = content();
    if (currentContent == newContent) return;
    remove();
    append(currentContent = newContent);
  });

  onDomAppend(node, () => attached(true));
  onDomRemove(node, () => attached(false));

  return node;
}

export const createIf = () => {
  const conditions = r.val([]);
  const content = r.val(null);
  const node = createSlot(content);
  
  r.effect(() => {
    const list = conditions().find(d => unwrapFn(d.cond))?.args;
    initializeLazyElements(list);
    content(list);
  });

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
    controller?.abort();
    controller = r.detach(() => {
      content(renderFn(arg));
    });
  });
  return createSlot(content);
}