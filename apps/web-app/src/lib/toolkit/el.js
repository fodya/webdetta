import {c, key, on, hook, cls, prop, css, attr} from '../frameorc/dom.js';

const ref = func => hook
  .insert((vnode) => func(vnode.elm))
  .destroy(() => func(null));
const op = {key, on, hook, cls, prop, attr, style: css, ref};

const el = new Proxy(c, {
  get: (_, k) => k in op ? op[k] : c[k],
  apply: (_, that, ...a) => c(...a)
});

export default el;
