// @ts-self-types="./types/runtime.d.ts"
import { Context } from '../context/sync.js';
import { isIterable, isObject, callFn } from '../common/utils.js';
import { r } from '../reactivity/index.js';
import { currentEffect } from '../reactivity/base.js';
import { Element, Operator, processItem } from './base.js';

const listItemKey = (d, i) => {
  if (isObject(d)) return d.id ?? i;
  return i;
};
function* listItemsToEntries(items, keyFn) {
  if (Array.isArray(items)) {
    for (let i = 0; i < items.length; i++) {
      const d = items[i];
      yield [keyFn(d, i, items), d];
    }
    return;
  }
  if (isIterable(items)) {
    yield* items.entries();
    return;
  }
  if (isObject(items)) yield* Object.entries(items);
}

export const toString = (...args) => {
  let str = '';
  for (const a of args) str += callFn(a);
  return str;
}

export const createText = arg => {
  if (typeof arg == 'function') {
    const node = document.createTextNode('');
    r.effect(() => node.textContent = callFn(arg));
    return node;
  } else {
    return document.createTextNode(String(arg));
  }
}

const TAIL = new WeakMap();
const REMOVE = new WeakSet();
const createContainer = (snapshot, content) => {
  let startNode;

  let nodes = [], prevNodes = [], operators = [];
  const contentEffect = r.detach(() => {
    const items = snapshot.set(currentEffect).run(callFn, content);
    processItem(items,
      o => operators.push(o),
      c => { nodes.push(c); REMOVE.delete(c); },
      true
    );

    for (const child of prevNodes) {
      if (REMOVE.has(child)) {
        Element.remove(child);
      }
    }
    prevNodes = [];

    if (startNode) {
      operatorsEffect.run();
      appendAfter(startNode);
    }
    return () => {
      for (const child of (prevNodes = nodes)) REMOVE.add(child);
      nodes = [];
      operators = [];
    }
  }, { track: true, writes: false, run: false });

  const operatorsEffect = r.effect(() => {
    for (const o of operators) Operator.apply(startNode.parentNode, o);
  }, { track: true, writes: false, run: false });

  const appendAfter = (newStartNode) => {
    if (!startNode) contentEffect.run();
    const parentChanged = startNode?.parentNode != newStartNode.parentNode;
    let tailNode = startNode = newStartNode;
    if (parentChanged) operatorsEffect.run();
    for (const node of nodes) {
      if (tailNode.nextSibling !== node) Element.appendAfter(tailNode, node);
      tailNode = TAIL.get(node) ?? node;
    }
    return tailNode;
  };

  const remove = () => {
    for (const child of nodes) Element.remove(child);
    contentEffect.cleanup();
  }
  const destroy = () => {
    for (const child of nodes) Element.remove(child);
    contentEffect.destroy();
  }

  return { appendAfter, remove, destroy };
}

export const createList = (itemsFn, renderItem, keyFn = listItemKey) => {
  const root = document.createTextNode('');
  const containers = new Map();
  Element.registerHook(root, 'afterAppend', () => {
    effect.run();
  });
  Element.registerHook(root, 'beforeRemove', () => {
    for (const c of containers.values()) c.remove();
    containers.clear();
  });

  const snapshot = Context.Snapshot();
  const effect = r.effect(() => {
    const items = callFn(itemsFn);

    let tail = root, i = 0;
    for (const [k, v] of listItemsToEntries(items, keyFn)) {
      let container = containers.get(k);
      if (!container) containers.set(k,
        container = createContainer(snapshot, () => {
          let res;
          r.untrack(() => res = renderItem(v, i, items, k));
          return res;
        })
      );
      REMOVE.delete(container);
      tail = container.appendAfter(tail);
      i++;
    }

    for (const [k, c] of containers) {
      if (REMOVE.has(c)) {
        c.destroy();
        containers.delete(k);
      }
      REMOVE.add(c);
    }
  }, { run: false });

  return root;
};

export const createSlot = (content) => {
  const root = document.createTextNode('');
  const container = createContainer(Context.Snapshot(), content);
  Element.registerHook(root, 'afterAppend', () => {
    TAIL.set(root, container.appendAfter(root));
  });
  Element.registerHook(root, 'beforeRemove', () => {
    container.remove();
  });
  return root;
}

export const createLazy = (arg) => {
  if (typeof arg != 'function') return arg;
  return  { [Element.lazy]: () => callFn(arg) }; // TODO: memo?
}

export const createIf = (cond, ...args) => {
  const conditions = [{ cond, value: args.map(createLazy) }];
  const node = createSlot(() =>
    conditions.find(d => callFn(d.cond))?.value
  );

  node.elif = (cond, ...args) => {
    conditions.push({ cond, value: args.map(createLazy) });
    return node;
  }
  node.else = (...args) => {
    conditions.push({ cond: true, value: args.map(createLazy) });
    delete node.elif;
    delete node.else;
    return node;
  }

  return node;
};

export const createDynamic = (deps, func) => {
  return createSlot(() => {
    const arg = deps();
    let res;
    r.untrack(() => res = func(arg));
    return res;
  });
};

export const createPick = (selectedKey, list, renderFn, keyFn = listItemKey) => {
  const cache = { key: undefined, val: undefined };
  return createSlot(() => {
    const items = callFn(list);
    const selected = callFn(selectedKey);

    let item, index = 0, found = false;
    for (const [key, value] of listItemsToEntries(items, keyFn)) {
      if (Object.is(key, selected)) { item = value; found = true; break; }
      index++;
    }
    if (!found) return;

    if (Object.is(cache.key, selected)) return cache.val;
    cache?.effect?.destroy();
    cache.key = selected;
    cache.effect = r.detach(() => {
      cache.val = renderFn(item, index, items, selected);
    });
    return cache.val;
  });
};
