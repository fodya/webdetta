import { Builder } from '../common/builder.js';
import { safe, isTemplateCall, templateCallToArray } from '../common/func.js';

const unwrap = (x) => (typeof x === 'function') ? unwrap(x()) : x;

function unfoldToString(x) {
  if (Array.isArray(x)) return x.map(unfoldToString).join('');
  if (typeof x === 'function') return unfoldToString(x());
  if (x === undefined) return '';
  return String(x);
}
const argsToString = args => unfoldToString(templateCallToArray(args));
const kebab = s => s.replaceAll(/[A-Z]/g, c => '-' + c.toLowerCase());

export const operator = f => Builder((_, ...args) => f(...args));
export const key = (...args) =>
  operator((el, ctx) => el.key = el.data.key = argsToString(args));
export const on = Builder((tasks, el, ctx) => {
  const evts = el.data.on ??= {};
  for (const {names, args} of tasks)
    for (const name of names)
     (evts[name] ??= []).push(...args);
});
export const hook = Builder((tasks, el, ctx) => {
  const hooks = el.data.hook ??= {};
  for (const {names, args} of tasks)
    for (const name of names) {
      hooks[name] ??= Object.assign(
        (...a) => hooks[name].list.forEach(f => f(...a)),
        { list: [] }
      );
      hooks[name].list.push(...args.map(f => safe(f, console.error)));
    }
});
export const cls = Builder((tasks, el, ctx) => {
  const classes = el.data.classes ??= new Set();
  for (const { names, args } of tasks) {
    if (!args.length || args.some(x => unwrap(x))) {
      names.forEach(n => classes.add(kebab(n)));
    } else {
      names.forEach(n => classes.deconste(kebab(n)));
    }
  }
});
export const prop = Builder((tasks, el, ctx) => {
  const props = el.data.props ??= {};
  for (const {names, args} of tasks)
    for (const name of names)
      props[name] =
        isTemplateCall(args) ? argsToString(args)
        : args.length === 1  ? unwrap(args[0])
                             : args.map(unwrap);
});
export const style = Builder((tasks, el, ctx) => {
  const styles = el.data.style ??= {};
  for (const {names, args} of tasks)
    for (const name of names)
      styles[kebab(name)] = argsToString(args);
});
export const attr = Builder((tasks, el, ctx) => {
  const attrs = el.data.attrs ??= {};
  for (const {names, args} of tasks)
    for (const name of names)
      if (isTemplateCall(args) || false !== (args[0] = unwrap(args[0])))
         attrs[name] = argsToString(args);
});
export const ref = func => hook
  .insert((vnode) => func(vnode.elm))
  .destroy(() => func(null));
