import { kebab } from '../common/dom.js';
import { err, isTemplateCall, unwrapFn } from '../common/utils.js';

/** @returns { (value: string) => number } Amortized O(1) per distinct string; O(n) store growth over lifetime. */
export const idStore = () => {
  const store = {};
  let counter = 0;
  return value => store[value] ??= counter++;
};

const charMapping = Object.fromEntries([...
  ` ␣(⦗)⦘:᛬.ꓸ,‚[❲]❳|⼁#＃<﹤>﹥{❴}❵"“'‘%％!ǃ&＆*∗/∕@＠`.matchAll(/../g)
].map(v => v[0].split('')));

/** O(n) in input string length. */
export const escape = str => {
  let res = '';
  for (const v of str) res += charMapping[v] ?? v;
  return CSS.escape(res);
};

/** O(|sel| + |parentSel|) typical; O(k) if &-replace with k occurrences. */
export const processNestedSelector = (sel = '', parentSel = '') => (
  !sel ? parentSel
  : typeof sel == 'function' ? sel(parentSel)
  : sel.includes('&') ? sel.replaceAll('&', parentSel)
  : err`Invalid selector: "${sel}"`
);

/** O(1) — returns single-element array (future: split cost if extended). */
export const splitSelector = str => [str];

/** O(entries) in style object size. */
export const styleStr = (style, important) => `{${
  Object.entries(style).map(([k, v]) =>
    kebab(k) + ': ' + v + (important ? ' !important' : '') + ';'
  ).join('')
}}`;

/** O(args) flatten + template parse. */
export const processMethodArgs = args =>
  isTemplateCall(args)
  ? String.raw(...args).match(/\S+/g) ?? []
  : args.flatMap(unwrapFn);

/** O(nodes) — one calculate per node. */
export const combinedStyle = nodes => {
  const res = {};
  for (const node of nodes) {
    node.calculate();
    Object.assign(res, node.style ?? {});
  }
  return res;
};
