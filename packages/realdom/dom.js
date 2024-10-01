import { isTemplateCall, templateCallToArray, safe, throttle } from '../common/func.js';
import { Builder, isBuilder } from '../common/builder.js';
import { kebab } from '../common/dom.js';
import Ctx from './ctx.js';

const falsy = v => v === undefined || v === null || v === false;

function prim(x) {
  if (falsy(x)) return false;
  if (isTemplateCall(x)) return prim(templateCallToArray(x));
  if (Array.isArray(x)) return x.length == 1 ? prim(x[0]) : x.map(prim).join('');
  if (isBuilder(x)) { throw new Error('Invalid argument'); };
  if (typeof x === 'function') return prim(x());
  return x;
}

const ElemBuilder = func => Builder((tasks, elem) => {
  if (elem instanceof ShadowRoot) elem = elem.host;
  return func(tasks, elem);
});
const ReactiveElemBuilder = func => ElemBuilder((tasks, elem) => {
  const ctx = Ctx.current().fork(() => updates.forEach(f => f()));
  const updates = ctx.run(func, [tasks, elem]);
  ctx.update();
});

const diff = (val, effect) => {
  let prev;
  return () => {
    const curr = val();
    if (prev !== curr) effect(prev = curr);
  }
}
const operators = {
  operator: (func) => ElemBuilder((_, elem) => func(elem)),
  reactive: (func) => ReactiveElemBuilder((_, elem) => [() => func(elem)]),
  on: ElemBuilder((tasks, elem) => {
    for (const {names, args} of tasks)
      for (const name of names)
        for (const arg of args)
          elem.addEventListener(name, arg);
  }),
  propRaw: ElemBuilder((tasks, elem) => {
    for (const {names, args} of tasks)
      for (const name of names) {
        if (args.length != 1)
          throw new Error('`propRaw` operator takes exactly 1 argument.');
        elem[name] = args[0];
      }
  }),
  prop: ReactiveElemBuilder((tasks, elem) =>
    tasks.map(({names, args}) => diff(
      () => prim(args),
      (val) => names.forEach(name => elem[name] = val)
    ))
  ),
  attr: ReactiveElemBuilder((tasks, elem) =>
    tasks.map(({names, args}) => diff(
      () => prim(args),
      (val) => names.forEach(name => {
        if (val === false) elem.removeAttribute(name);
        else elem.setAttribute(name, val);
      })
    ))
  ),
  style: ReactiveElemBuilder((tasks, elem) =>
    tasks.map(({names, args}) => diff(
      () => prim(args),
      (val) => names.forEach(name => {
        if (val === false) delete elem.style[name];
        else elem.style[name] = val;
      })
    ))
  ),
  cls: ReactiveElemBuilder((tasks, elem) =>
    tasks.map(({names, args}) => diff(
      () => prim(args),
      (val) => names.forEach(name => {
        if (val === false) elem.classList.remove(name);
        else elem.classList.add(name);
      })
    ))
  )
}

const append = safe((parent, op) => {
  if (falsy(op)) {}
  else if (isBuilder(op)) Builder.launch(op, parent);
  else if (Array.isArray(op)) { for (const c of op) append(parent, c); }
  else if (op instanceof Node) parent.appendChild(op);
  else append(parent, Text(op));
});
const append_ = (parent, ...op) => append(parent, op);

const Text = val => Builder((_, parent) => {
  const elem = document.createTextNode('');
  const op = ReactiveElemBuilder((_, elem) => [
    diff(() => prim(val), v => elem.textContent = v)
  ]);
  append(elem, op);
  parent.appendChild(elem);
});

const NS = { svg: 'http://www.w3.org/2000/svg' };
const Element = (name, options={}, process) => Builder((tasks, parent) => {
  const ctx = Ctx.current();
  const prevNamespace = ctx.ns;
  try {
    const elem = (ctx.ns = name in NS ? NS[name] : prevNamespace)
      ? document.createElementNS(ctx.ns, name, options)
      : document.createElement(name, options);
    if (process) process(elem, parent, ctx);
    for (const {args} of tasks)
      for (const op of args)
        append(elem, op, ctx);
    parent.appendChild(elem);
  } catch (e) {
    console.error(e);
  }
  ctx.ns = prevNamespace;
});

const el = new Proxy({}, {
  get: (_, name) =>
    name[0] == name[0].toUpperCase()
    ? Element(kebab(name[0].toLowerCase() + name.slice(1)))
    : operators[name]
});

export { el, Element, append_ as append };
