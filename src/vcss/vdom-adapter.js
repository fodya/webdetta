import { el } from '../frameorc/index.js';

import { Adapter } from './index.js';
export default Adapter({
  wrapper: (nodes, process) => el.operator(el => process(el, nodes)),
  addClass: (el, cls) => (el.data.classes ??= new Set()).add(cls),
  addStyle: (el, style) => Object.assign(el.data.style ??= {}, style)
});

