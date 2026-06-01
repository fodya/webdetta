import { toCssPropertyName } from "@webdetta/common/dom";
import { isTemplateCall } from "@webdetta/common/checks";
import { unwrapFn } from "@webdetta/common/func";

/**
 * @returns {(value: unknown) => number}
 */
export const idStore = () => {
  const store = {};
  let counter = 0;
  return (value) => store[value] ??= counter++;
};

const charMap = Object.fromEntries(
  [...` ␣(⦗)⦘:᛬.ꓸ,‚[❲]❳|⼁#＃<﹤>﹥{❴}❵"“'‘%％!ǃ&＆*∗/∕@＠`.matchAll(/../g)]
    .map((v) => v[0].split("")),
);

/**
 * @param {string} str
 * @returns {string}
 */
export const escape = (str) => {
  let res = "";
  for (const v of str) res += charMap[v] ?? v;
  return CSS.escape(res);
};

/**
 * @param {string} [sel]
 * @param {string} [parentSel]
 * @returns {string}
 */
export const processNestedSelector = (sel = "", parentSel = "") => {
  if (!sel) return parentSel;
  if (typeof sel === "function") return sel(parentSel);
  if (sel.includes("&")) return sel.replaceAll("&", parentSel);
  throw new Error(`Invalid selector: "${sel}"`);
};

/**
 * @param {Record<string, unknown>} style
 * @param {boolean} important
 * @returns {string}
 */
export const styleStr = (style, important) =>
  `{${
    Object.entries(style)
      .map(([k, v]) =>
        toCssPropertyName(k) + ": " + v + (important ? " !important" : "") + ";"
      )
      .join("")
  }}`;

/**
 * @param {unknown[]} args
 * @returns {unknown[]}
 */
export const processMethodArgs = (args) =>
  isTemplateCall(args)
    ? String.raw(...args).match(/\S+/g) ?? []
    : args.flatMap(unwrapFn);
