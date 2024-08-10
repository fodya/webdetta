import { operator, hook } from './operators.js';
import { Fragment, Element, append, attach } from './vdom.js';
import { Builder } from '../common/builder.js';

const CompData = (ctx) => ({
  stateI: 0,
  state: [],
  refresh: ctx.refresh,
  ctx: new Map(),
  parent: ctx.parent,
  isAlive: true,
  construct: undefined,
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
  const ctx = (...a) => a.length ? ctxSet(comp, k, a[0]) : ctxGet(comp, k);
  ctx.Provide = Component((...a) => {
    if (a.length != 2) throw new Error('Exactly two arguments expected.');
    ctx(a[0]);
    return a[1];
  });
  return ctx;
}

const Effect = (args, func) => {
  const [st] = Val({ args: null, cancellation: null, error: null });
  const alive = Component.Lifecycle() ?? true;
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
  if (!alive) cancel();

  return { args: st.args, perform, cancel };
}

const updateVnode = (oldVnode, vnode, ctx, render, args, appendix) => {
  const pComp = comp;
  try {
    comp = vnode.data.comp = oldVnode?.data?.comp ?? CompData(ctx);
    comp.stateI = 0;
    comp.appendix = appendix;

    try { comp.construct = render(...args); }
    catch (e) { console.error(e); }
    comp.construct ??= Fragment();

    vnode.children = [];
    const childCtx = { ...ctx, parent: vnode };
    append(comp.construct(comp.appendix), vnode, childCtx);
  } catch (e) {
    console.error(e);
  }
  comp = pComp;
}

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

Object.assign(Component, {
  Context: Context,
  Lifecycle: Context(),
  mount: (element, render) => {
    const body = attach(element);
    return new Promise(resolve => body(
      hook.insert.postpatch(() => resolve(body)),
      render
    ));
  },
});

export { Component, Val, Effect, appendToComponent };
