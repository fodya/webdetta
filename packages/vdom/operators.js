import { Builder } from '../common/builder.js';
import { catchErrors, isTemplateCall, templateCallToArray } from '../common/utils.js';
import { kebab } from '../common/dom.js';

const unwrap = (x) => (typeof x === 'function') ? unwrap(x()) : x;

function unfoldToString(x) {
  if (Array.isArray(x)) return x.map(unfoldToString).join('');
  if (typeof x === 'function') return unfoldToString(x());
  if (x === undefined) return '';
  return String(x);
}
const argsToString = args => unfoldToString(templateCallToArray(args));

export const operator = f => Builder((_, ...args) => f(...args));
export const key = (...args) =>
  operator((el) => el.key = el.data.key = argsToString(args));
export const on = Builder((tasks, el) => {
  const evts = el.data.on ??= {};
  for (const {names, args} of tasks)
    for (const name of names)
     (evts[name] ??= []).push(...args);
});
export const hook = Builder((tasks, el) => {
  const hooks = el.data.hook ??= {};
  for (const {names, args} of tasks) {
    const handlers = args.map(f => catchErrors(f, console.error));
    for (const name of names) {
      hooks[name] ??= (...a) => hooks[name].list.forEach(f => f(...a));
      (hooks[name].list ??= []).push(...handlers);
    }
  }
});
export const cls = Builder((tasks, el) => {
  const classes = el.data.classes ??= new Set();
  for (const { names, args } of tasks) {
    if (!args.length || args.some(x => unwrap(x))) {
      names.forEach(n => classes.add(kebab(n)));
    } else {
      names.forEach(n => classes.delete(kebab(n)));
    }
  }
});
export const prop = Builder((tasks, el) => {
  const props = el.data.props ??= {};
  for (const {names, args} of tasks)
    for (const name of names)
      props[name] =
        isTemplateCall(args) ? argsToString(args)
        : args.length === 1  ? unwrap(args[0])
                             : args.map(unwrap);
});
export const style = Builder((tasks, el) => {
  const styles = el.data.style ??= {};
  for (const {names, args} of tasks)
    for (const name of names)
      styles[kebab(name)] = argsToString(args);
});
export const attr = Builder((tasks, el) => {
  const attrs = el.data.attrs ??= {};
  for (const {names, args} of tasks)
    for (const name of names)
      if (isTemplateCall(args) || false !== (args[0] = unwrap(args[0])))
         attrs[name] = argsToString(args);
});
export const ref = func => hook
  .insert((vnode) => func(vnode.elm))
  .destroy(() => func(null));
