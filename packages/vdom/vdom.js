import { Builder } from '../common/builder.js';
import { throttle, templateCallToArray } from '../common/utils.js';
import { patch, VNode } from './snabb.js';

export { VNode };

const NS = { svg: 'http://www.w3.org/2000/svg' };
export const Element = tagName => Builder((tasks, parent, ctx={}) => {
  const result = new VNode(tagName, {}, []);
  const prevNamespace = ctx.ns;
  try {
    if (tagName in NS) ctx.ns = NS[tagName];
    if (ctx.ns !== undefined) result.data.ns = ctx.ns;
    for (const { args } of tasks)
      for (const child of templateCallToArray(args))
        append(child, result, ctx);
    parent.children.push(result);
  } catch (e) {
    console.error(e);
  }
  ctx.ns = prevNamespace;
});

export const Fragment = Element(undefined);

export function append(child, el, ctx) {
  if (child === undefined || child === null || child === false) {}
  else if (Builder.isBuilder(child)) Builder.launch(child, el, ctx);
  else if (Array.isArray(child)) child.forEach(c => append(c, el, ctx));
  else if (typeof child === 'function') append(child(), el, ctx);
  else if (child instanceof VNode) el.children.push(child);
  else el.children.push({ text: String(child) });
}

export function attach(domEl) {
  let vEl, content = [], refresh = throttle.T(0, () => {
    let view = new VNode(domEl.tagName.toLowerCase(), {}, []);
    let ctx = { refresh };
    for (const child of content) append(child, view, ctx);
    vEl = patch(vEl ?? domEl, view);
  });
  const setter = (...args) => (content = args, refresh());
  return Object.assign(setter, { refresh });
}
