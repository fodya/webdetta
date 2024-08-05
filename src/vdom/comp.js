import { operator, hook } from './operators.js';
import { Fragment, Element, append, attach } from './vdom.js';
import { throttle } from '../common/func.js';
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
  if (comp) throw new Error('Cannot create context while in component function');
  const k = Math.random().toString(16).slice(2, 12);
  return (...a) => a.length ? ctxSet(comp, k, a[0]) : ctxGet(comp, k);
}

const Effect = (args, func) => {
  const ef = Val({})[0][Effect.symbol] ??= {
    func: null, args: null,
    perform: () => {
      ef.cancel?.();
      const cancel = ef.func(...ef.args);
      if (cancel != null && typeof cancel != 'function')
        throw new Error('effect must return a function or undefined');
      ef.cancel = () => (ef.cancel = null, cancel?.());
    },
    cancel: null,
  };
  appendToComponent(hook.destroy(throttle(() => ef.cancel?.())));
  return Object.assign(ef, { args, func });
}
Effect.symbol = Symbol('Effect.symbol');
const traverseVnodeEffects = (vnode, cb) => {
  const { data, children } = vnode;
  if (Array.isArray(children)) for (const child of children)
    traverseVnodeEffects(child, cb);
  if (data?.comp) for (const item of data.comp.state)
    if (typeof item == 'object' && item != null && Effect.symbol in item)
      cb(item[Effect.symbol]);
}

const updateVnode = (oldVnode, vnode, ctx, render, args, appendix) => {
  const pComp = comp;
  try {
    comp = vnode.data.comp = oldVnode?.data?.comp ?? CompData(ctx);
    comp.stateI = 0;
    comp.appendix = [];
    comp.isAlive = true;

    const componentOperators = [];
    for (const op of appendix) {
      const isComp = op && typeof op == 'object' && componentOperator in op;
      (isComp ? componentOperators : comp.appendix).push(op);
    }

    for (const op of componentOperators) op.prepatch?.(vnode);
    try { if (comp.isAlive) comp.construct = render(...args); }
    catch (e) { console.error(e); }
    comp.construct ??= Element('div');

    vnode.children = [];
    const childCtx = { ...ctx, parent: vnode };
    append(comp.construct(comp.appendix), vnode, childCtx);
    for (const op of componentOperators) op.postpatch?.(vnode);
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

const componentOperator = Symbol('Component.operator');
const Component = Object.assign((render) => (...args) =>
  componentInstance(null, render, args, [])
, {
  Context: Context,
  toggleEffectsLifecycle: (isAlive) => ({
    [componentOperator]: true,
    prepatch: vnode => vnode.data.comp.isAlive = isAlive,
    postpatch: vnode => traverseVnodeEffects(vnode, (eff) => {
      if (isAlive && eff.cancel == null) eff.perform();
      if (!isAlive && eff.cancel != null) eff.cancel();
    })
  }),
  mount: (element, render) => {
    const body = attach(element);
    return new Promise(resolve => body(
      hook.insert.postpatch(() => resolve(body)),
      render
    ));
  }
});

export { Component, Val, Effect, appendToComponent };
