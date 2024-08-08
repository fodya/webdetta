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
  const provider = Component((val, child) => (ctx(val), child));
  ctx.Provider = (val) => (...a) => {
    if (a.length != 1) throw new Error('Exactly one argument expected.');
    return provider(val, a[0]);
  }
  return ctx;
}

const Effect = (args, func) => {
  const [st] = Val({ args: null, cancellation: null });
  st.alive = Component.Lifecycle() ?? true;
  st.func = func;
  st.perform = () => {
    if (!st.alive) return;
    try { st.cancellation?.(); }
    catch (e) { console.error(e); }
    st.cancellation = st.func(...(st.args = args));
    if (st.cancellation != null && typeof st.cancellation != 'function')
      throw new Error('effect must return a function or undefined');
  }

  st.cancel = () => {
    st.args = null;
    try { st.cancellation?.(); }
    catch (e) { console.error(e); }
    st.cancellation = null;
  }
  if (!st.alive) st.cancel();

  return { args: st.args, perform: st.perform, cancel: st.cancel };
}

const updateVnode = (oldVnode, vnode, ctx, render, args, appendix) => {
  const pComp = comp;
  try {
    comp = vnode.data.comp = oldVnode?.data?.comp ?? CompData(ctx);
    comp.stateI = 0;
    comp.appendix = appendix;

    try { comp.construct = render(...args); }
    catch (e) { console.error(e); }
    comp.construct ??= Element('div');

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
