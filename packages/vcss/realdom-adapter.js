import { el } from '../realdom/index.js';
import { kebab } from '../common/dom.js';
import { r } from '../reactivity/index.js';
import { recurrent } from '../realdom/operators.js';
import { Adapter } from './index.js';

export default Adapter({
  wrapper: (nodes, process) => el.ref(dom => recurrent(() => {
    for (const node of nodes) process(dom, node);
    return () => {
      for (const node of nodes) dom.classList.remove(node.cls);
    };
  })),
  addStyle: (el, style) => {
    for (const [key, val] of Object.entries(style))
      el.style.setProperty(kebab(key), val);
  },
  addClass: (el, cls) => el.classList.add(cls),
  removeClass: (el, cls) => el.classList.remove(cls)
});
