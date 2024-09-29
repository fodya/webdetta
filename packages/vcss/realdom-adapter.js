import { el } from '../realdom/index.js';
import { Adapter } from './index.js';

export default Adapter({
  wrapper: (nodes, process) => el.operator(dom => process(dom, nodes)),
  addClass: (el, cls) => el.classList.add(cls),
  addStyle: (el, style) => Object.assign(el.style, style)
});
