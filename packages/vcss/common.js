import { kebab } from '../common/dom.js';
import { isTemplateCall, unwrapFn } from '../common/utils.js';

export const ID = (() => {
  const store = {}, indexes = {};
  return (type, value) => store[type + value] ??= (
    indexes[type] ??= -1,
    ++indexes[type]
  );
})();
const chars = Object.fromEntries([...
  ` ␣(⦗)⦘:᛬.ꓸ,‚[❲]❳|⼁#＃<﹤>﹥{❴}❵"“'‘%％!ǃ&＆*∗/∕@＠`.matchAll(/../g)
].map(v => v[0].split('')));
export const escape = str => {
  let res = '';
  for (const v of str) res += chars[v] ?? v;
  return CSS.escape(res);
}
export const selectorTmpl = (sel='', val='') => (
  typeof sel == 'function' ? sel(val)
  : sel.includes('&') ? sel.replaceAll('&', val)
  : val + sel
);
export const splitSelector = str => [str];
export const styleStr = (style, important) => `{${
  Object.entries(style).map(([k, v]) =>
    kebab(k) + ': ' + v + (important ? ' !important' : '') + ';'
  ).join('')
}}`;

export const processMethodArgs = args =>
  isTemplateCall(args)
  ? String.raw(...args).match(/\S+/g) ?? []
  : args.flatMap(unwrapFn);

// const joinStyle = (sep, v1, v2) => v1 && v2 ? v1 + sep + v2 : v1 ?? v2;
export const combinedStyle = nodes => {
  const res = {};
  for (const node of nodes) {
    node.calculate();
    Object.assign(res, node.style ?? {});
  }
  return res;
}
