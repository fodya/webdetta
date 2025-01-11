import { el } from '../realdom/index.js';
import { kebab } from '../common/dom.js';
import { r } from '../reactivity/index.js';
import { recurrent } from '../realdom/operators.js';
import { onRemove } from '../realdom/dynamic.js';
import { Adapter } from './index.js';

const addNode = (ctx, dom, node) => {
  let prevCls = node.cls;
  node.calculate();

  if (node.inline) {
    for (const [key, val] of Object.entries(node.style))
      dom.style.setProperty(kebab(key), val);
    return;
  }

  node.insertRule(ctx);
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
  el.ref(dom => recurrent(() => {
    for (const node of nodes) addNode(ctx, dom, node);
    onRemove(() => {
      for (const node of nodes) removeNode(dom, node);
    });
  }))
);
