import { isIterable, isObject, unwrapFn } from '../common/utils.js';
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

const listItemKey = (d, i) => {
  if (typeof d == 'number' || typeof d == 'string') return d;
  if (d) {
    if ('key' in d) return d.key;
    if ('id' in d) return d.id;
  }
  return i;
};
const listItemsToEntries = (items, keyFn) => new Map(
  Array.isArray(items) ? items.map((d, i, a) => [keyFn(d, i, a), d])
  : isIterable(items) ? Array.from(items.entries())
  : isObject(items) ? Object.entries(items)
  : null
)
export const createList = (itemsFn, renderItem, keyFn = listItemKey) => {
  const root = document.createTextNode('');

  const elements = new Map();
  const effects = new Map();

  const connect = (k, v, i, items) => {
    let dom;
    const effect = r.subtle.effectRoot(() => {
      dom = renderItem(v, i, items, k);
    });
    effects.set(k, effect);
    elements.set(k, dom);
    return dom;
  };
  const disconnect = (k) => {
    effects.get(k)?.destroy();
    effects.delete(k);
    const el = elements.get(k);
    if (el) Element.remove(el);
    elements.delete(k);
  };

  const attached = r.dval(false);

  r.effect(() => {
    if (!attached()) {
      for (const k of elements.keys()) disconnect(k);
      return;
    }

    const items = unwrapFn(itemsFn);
    const entries = listItemsToEntries(items, keyFn);

    let last = root, i = 0;
    for (const [k, v] of entries) {
      let el = elements.get(k);
      if (!el) el = connect(k, v, i, items);
      if (el !== last.nextSibling) {
        Element.appendAfter(last, el);
      }
      last = el;
      i++;
    }

    for (const k of elements.keys()) {
      if (!entries.has(k)) disconnect(k);
    }
  });

  onDomAppend(root, () => attached(true));
  onDomRemove(root, () => attached(false));

  return root;
};

export const createSlot = (content) => {
  const node = document.createTextNode('');
  const attached = r.dval(false);

  let controller;
  let nodes = [];
  const append = (content) => {
    if (!content) return;
    nodes = [];
    
    controller = r.subtle.effectRoot(() => {
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
    });
  };

  const remove = () => {
    if (!nodes) return;
    for (const child of nodes) Element.remove(child);
    nodes = null;
    controller?.destroy();
    controller = null;
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
    controller = r.subtle.effectRoot(() => {
      content(renderFn(arg));
    });
  });
  return createSlot(content);
}