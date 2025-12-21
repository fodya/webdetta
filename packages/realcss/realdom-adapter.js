import { el } from '../realdom/index.js';
import { kebab } from '../common/dom.js';
import { Operator } from '../realdom/dom.js';
import { r } from '../reactivity/index.js';
import { Adapter } from './index.js';

const addNode = (styleSheet, dom, node) => {
  let prevCls = node.cls;
  node.calculate();

  if (node.inline) {
    for (const [key, val] of Object.entries(node.style))
      dom.style.setProperty(kebab(key), val);
    return;
  }

  styleSheet.insertNode(node);
  if (prevCls && node.cls != prevCls)
    dom.classList.replace(prevCls, node.cls);
  else
    dom.classList.add(node.cls);
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
    Operator.onCleanup(() => {
      for (const node of nodes) removeNode(dom, node);
    });
  }))
);
