import { kebab } from '../common/dom.js';
import { err, isTemplateCall, unwrapFn } from '../common/utils.js';

export const idStore = () => {
  const store = {};
  let counter = 0;
  return value => store[value] ??= counter++;
};

const charMap = Object.fromEntries(
  [...` ␣(⦗)⦘:᛬.ꓸ,‚[❲]❳|⼁#＃<﹤>﹥{❴}❵"“'‘%％!ǃ&＆*∗/∕@＠`.matchAll(/../g)]
    .map(v => v[0].split('')),
);

export const escape = str => {
  let res = '';
  for (const v of str) res += charMap[v] ?? v;
  return CSS.escape(res);
};

export const processNestedSelector = (sel = '', parentSel = '') =>
  !sel ? parentSel
  : typeof sel === 'function' ? sel(parentSel)
  : sel.includes('&') ? sel.replaceAll('&', parentSel)
  : err`Invalid selector: "${sel}"`;

export const styleStr = (style, important) => `{${
  Object.entries(style)
    .map(([k, v]) => kebab(k) + ': ' + v + (important ? ' !important' : '') + ';')
    .join('')
}}`;

export const processMethodArgs = args =>
  isTemplateCall(args)
    ? String.raw(...args).match(/\S+/g) ?? []
    : args.flatMap(unwrapFn);
