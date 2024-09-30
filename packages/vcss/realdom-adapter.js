import { el } from '../realdom/index.js';
import { Adapter } from './index.js';

export default Adapter({
  wrapper: (nodes, process) => el.reactive(dom => [
    nodes.map(d => d.recalculate.bind(d)),
    () => process(dom, nodes)
  ]),
  addClass: (el, cls) => el.classList.add(cls),
  addStyle: (el, style) => Object.assign(el.style, style)
});
