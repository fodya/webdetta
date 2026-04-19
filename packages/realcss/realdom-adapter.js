// @ts-self-types="./types/realdom-adapter.d.ts"
import { el } from '../realdom/index.js';
import { kebab } from '../common/dom.js';
import { r } from '../reactivity/index.js';
import { Adapter } from './index.js';

const addNode = (styleSheet, dom, node) => {
  node.calculate();
  if (node.inline) {
    for (const [key, val] of Object.entries(node.style))
      dom.style.setProperty(kebab(key), val);
    return;
  } else {
    styleSheet.insertNode(node);
    dom.classList.add(node.cls);
  }
}

const removeNode = (dom, node) => {
  if (node.inline) {
    for (const key of Object.keys(node.style))
      dom.style.removeProperty(kebab(key));
  } else {
    dom.classList.remove(node.cls);
  }
}

export default Adapter((ctx, nodes) =>
  el.ref(dom => r.effect(() => {
    for (const node of nodes) addNode(ctx, dom, node);
    return () => {
      for (const node of nodes) removeNode(dom, node);
    };
  }))
);
