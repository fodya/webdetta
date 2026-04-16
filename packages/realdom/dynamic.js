import { isIterable, isObject, callFn } from '../common/utils.js';
import { once } from '../execution/index.js';
import { r } from '../reactivity/index.js';
import { Element, Operator, processItem } from './base.js';

const listItemKey = (d, i) => {
  if (typeof d == 'number' || typeof d == 'string') return d;
  if (d && Object.hasOwn(d, 'id')) return d.id;
  return i;
};
const listItemsToEntries = (items, keyFn) => new Map(
  Array.isArray(items) ? items.map((d, i, a) => [keyFn(d, i, a), d])
  : isIterable(items) ? Array.from(items.entries())
  : isObject(items) ? Object.entries(items)
  : null
);

const lastNodes = new WeakMap();
const createContainer = (content) => {
  let startNode;

  const nodes = [], operators = [];
  const contentEffect = r.effect(() => {
    const items = callFn(content);
    processItem(items, o => operators.push(o), c => nodes.push(c), true);
    if (startNode) appendAfter(startNode);
    return () => {
      for (const child of nodes) Element.remove(child);
      nodes.length = 0;
      operators.length = 0;
    }
  }, { writes: false, attach: false, track: true, run: false });
  
  const operatorsEffect = r.effect(() => {
    for (const o of operators) Operator.apply(startNode.parentNode, o);
  }, { writes: false, attach: false, track: true, run: false });

  const initContent = once(contentEffect.run.bind(contentEffect));
  const appendAfter = (newStartNode) => {
    initContent();
    const parentChanged = startNode?.parentNode != newStartNode.parentNode;
    let lastNode = startNode = newStartNode;
    if (parentChanged) operatorsEffect.run();
    for (const node of nodes) {
      if (lastNode.nextSibling !== node) Element.appendAfter(lastNode, node);
      lastNode = lastNodes.get(node) ?? node;
    }
    return lastNode;
  };

  const remove = () => {
    contentEffect.cleanup();
    operatorsEffect.cleanup();
  }
  const destroy = () => {
    contentEffect.destroy();
    operatorsEffect.destroy();
  }

  return { nodes, appendAfter, remove, destroy };
}

export const createList = (itemsFn, renderItem, keyFn = listItemKey) => {
  const root = document.createTextNode('');
  const containers = new Map();
  Element.registerHook(root, 'afterAppend', () => effect.run());
  Element.registerHook(root, 'beforeRemove', () => {
    for (const c of containers.values()) c.remove();
    containers.clear();
  });

  const effect = r.effect(() => {
    const items = callFn(itemsFn);
    const entries = listItemsToEntries(items, keyFn);

    let last = root, i = 0;
    for (const [k, v] of entries) {
      let container = containers.get(k);
      if (!container) containers.set(k, container = createContainer(
        () => renderItem(v, i, items, k)
      ));
      last = container.appendAfter(last);
      i++;
    }

    for (const [k, c] of containers) {
      if (!entries.has(k)) {
        c.remove();
        containers.delete(k);
      }
    }
  }, { run: false });

  return root;
};

export const createSlot = (content) => {
  const root = document.createTextNode('');
  const container = createContainer(content);
  Element.registerHook(root, 'afterAppend', () => {
    lastNodes.set(root, container.appendAfter(root));
  });
  Element.registerHook(root, 'beforeRemove', () => container.remove());
  return root;
}

export const createIf = () => {
  const conditions = [];
  const node = createSlot(() =>
    conditions.find(d => callFn(d.cond))?.value
  );

  node.elif = (cond, ...args) => {
    conditions.push({ cond, value: args });
    return node;
  }
  node.else = (...args) => {
    conditions.push({ cond: true, value: args });
    delete node.elif;
    delete node.else;
    return node;
  }

  return node;
}

export const createDynamic = (deps, func) => {
  const content = r.val();
  r.effect(() => {
    const arg = deps();
    r.effect(() => content(func(arg)), { track: false })
  });
  return createSlot(content);
}