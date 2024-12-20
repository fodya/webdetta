import { el } from '../realdom/index.js';
import { r } from '../reactivity/index.js';
import { cancellableEffect } from '../realdom/operators.js';
import { Adapter } from './index.js';

export default Adapter({
  wrapper: (nodes, process) => el.ref(dom => cancellableEffect(() => {
    for (const node of nodes) process(dom, node);
    return () => {
      for (const node of nodes) dom.classList.remove(node.cls);
    };
  })),
  addStyle: (el, style) => Object.assign(el.style, style),
  addClass: (el, cls) => el.classList.add(cls),
  removeClass: (el, cls) => el.classList.remove(cls)
});
