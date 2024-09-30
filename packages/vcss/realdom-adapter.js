import { el } from '../realdom/index.js';
import { Adapter } from './index.js';

export default Adapter({
  wrapper: (nodes, process) => el.reactive(dom => [
    () => process(dom, nodes)
  ]),
  addStyle: (el, style) => Object.assign(el.style, style),
  addClass: (el, cls) => el.classList.add(cls),
  removeClass: (el, cls) => el.classList.remove(cls)
});
