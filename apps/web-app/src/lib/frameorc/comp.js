import { frag, c, operator, hook, append, attach } from './dom.js';

let root;
let i = 0;
let state = null; // root state

const Val = (arg) => {
  const j = i++;
  state[j] ??= arg;
  const val = root.Ref(state, j);
  return [val(), v => val(v)];
}

let operators;
const applyOperator = (...op) => operators.push(...op);

const Component = (render) => {
  const updateNode = (vnode, args, operators_) => {
    const ctx = vnode.data.ctx;
    const freeze = operators_.includes(Component.freeze);

    const [pRoot, pI, pState, pOperators] = [root, i, state, operators];
    [root, i, state, operators] = [ctx.root, 0, vnode.data.state, []];
  
    if (!freeze) {
      try { vnode.data.construct = render(...args); }
      catch (e) { console.log(e); }
    }
    vnode.data.construct ??= c.Div();
    
    vnode.children = [];
    append(vnode.data.construct(operators, operators_), vnode, ctx);
    vnode.data.state = state;
    
    [root, i, state, operators] = [pRoot, pI, pState, pOperators];
  }
  
  const withOperators = (args, operators) => new Proxy(
    frag(
      operator((vnode, ctx_) => {
        vnode.data.is = render;
        vnode.data.ctx = ctx_;
      }),
      hook
        .init(vnode => {
          vnode.data.state = [];
          updateNode(vnode, args, operators);
        })
        .prepatch((oldVnode, vnode) => {
          vnode.data.state = oldVnode.data.state;
          vnode.data.construct = oldVnode.data.construct;
          updateNode(vnode, args, operators);
        })
    ), {
      apply: (_, __, ops) =>
        withOperators(args, operators.concat(ops))
    }
  );
  return (...args) => withOperators(args, []);
}

Component.freeze = operator(() => {});
Component.mount = (element, render) => {
  const body = attach(element);
  return new Promise(resolve => body(
    operator((_, ctx) => { ctx.root = body; }),
    hook.postpatch(() => resolve(body)),
    render
  ));
}

export { Component, Val, applyOperator };
