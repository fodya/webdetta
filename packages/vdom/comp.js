import { operator, hook } from './operators.js';
import { Fragment, Element, append, attach } from './vdom.js';
import { Builder } from '../common/builder.js';

const CompData = (ctx) => ({
  stateI: 0,
  state: [],
  refresh: ctx.refresh,
  ctx: new Map(),
  parent: ctx.parent,
  appendix: [],
});

let comp;
const appendToComponent = (...a) => comp.appendix.push(...a);

const Val = (arg) => {
  const j = comp.stateI++;
  const { refresh, state } = comp;
  return [state[j] ??= arg, v => (state[j] = v, refresh())];
}

const ctxGet = (comp, k) => comp &&
  (comp.ctx.get(k) ?? ctxGet(comp.parent?.data?.comp, k));
const ctxSet = (comp, k, v) => (comp.ctx.set(k, v), v);

const Context = () => {
  if (comp) throw new Error('Context must be created outside of component.');
  const k = Math.random().toString(16).slice(2, 12);
  return (...a) => a.length ? ctxSet(comp, k, a[0]) : ctxGet(comp, k);
}

const Effect = (args, func) => {
  const [st] = Val({ args: null, cancellation: null, error: null });
  const alive = lifecycle() !== false;
  const perform = () => {
    if (!alive || st.error) return;

    try { st.cancellation?.(); }
    catch (e) { console.error(e); }

    try { st.cancellation = func(...(st.args = args)); }
    catch (e) { console.error(st.error = e); }
    if (st.cancellation != null && typeof st.cancellation != 'function')
      throw new Error('Effect handler must return a function or undefined.');
  }

  const cancel = () => {
    st.args = null;
    try { st.cancellation?.(); }
    catch (e) { console.error(e); }
    st.cancellation = null;
  }
  if (!alive && st.args?.length === 0) cancel();

  return { args: st.args, perform, cancel };
}

const updateVnode = (oldVnode, vnode, ctx, render, args, appendix) => {
  const pComp = comp;
  try {
    comp = vnode.data.comp = oldVnode?.data?.comp ?? CompData(ctx);
    comp.stateI = 0;
    comp.appendix = [];

    const postprocess = [];
    for (const op of appendix) {
      if (typeof op == 'object' && op && componentPreprocess in op) {
        append(op[componentPreprocess], vnode, ctx);
        continue;
      }
      if (typeof op == 'object' && op && componentPostprocess in op) {
        postprocess.push(op[componentPostprocess]);
        continue;
      }
      comp.appendix.push(op);
    }

    vnode.children = [];
    vnode.construct = (
      lifecycle() !== false
      ? (render(...args) ?? Fragment())(comp.appendix)
      : oldVnode?.construct
    ) ?? Fragment();
    const childCtx = { ...ctx, parent: vnode };
    append(vnode.construct, vnode, childCtx);

    for (const op of postprocess) append(op, vnode, ctx);
  } catch (e) {
    console.error(e);
  }
  comp = pComp;
}

const componentPreprocess = Symbol();
const componentPostprocess = Symbol();
const componentInstance = (ctx, render, args, appendix) => new Proxy(
  Fragment(
    operator((vnode, ctx_) => (ctx = ctx_, vnode.data.is = render)),
    hook.init(vnode =>
      updateVnode(null,     vnode, ctx, render, args, appendix)
    ).prepatch((oldVnode, vnode) =>
      updateVnode(oldVnode, vnode, ctx, render, args, appendix)
    )
  ), {
    apply: (target, _, ops) =>
      typeof ops[0] == 'symbol' && ops[0] == Builder.symbol
      ? target(...ops)
      : componentInstance(ctx, render, args, appendix.concat(ops))
  });

const Component = (render) => (...args) =>
  componentInstance(null, render, args, []);
const lifecycle = Context();

Object.assign(Component, {
  Context: Context,
  lifecycle: lifecycle,
  preprocess: (...op) => ({[componentPreprocess]: op}),
  postprocess: (...op) => ({[componentPostprocess]: op}),
  mount: (element, render) => {
    const body = attach(element);
    return new Promise(resolve => body(
      hook.insert.postpatch(() => resolve(body)),
      render
    ));
  },
});

export { Component, Val, Effect, appendToComponent };
