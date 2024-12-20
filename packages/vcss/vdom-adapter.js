import { el } from '../vdom/index.js';
import { Adapter } from './index.js';

export default Adapter({
  wrapper: (nodes, process) => el.operator(el => {
    for (const node of nodes) process(el, node);
  }),
  addClass: (el, cls) => (el.data.classes ??= new Set()).add(cls),
  addStyle: (el, style) => Object.assign(el.data.style ??= {}, style)
});
