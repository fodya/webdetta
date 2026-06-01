import { isTemplateCall } from "./checks.js";

/**
 * @param {unknown} d
 * @returns {unknown}
 */
export const callFn = (d) => typeof d == "function" ? d() : d;

/**
 * @param {unknown} d
 * @returns {unknown}
 */
export const unwrapFn = (d) => typeof d == "function" ? unwrapFn(d()) : d;

/**
 * @param {unknown} d
 * @returns {(...args: unknown[]) => unknown}
 */
export const toFn = (d) => typeof d == "function" ? d : () => d;

/**
 * @param {unknown[]} args
 * @returns {unknown[]}
 */
export const templateCallToArray = (args) => {
  if (!isTemplateCall(args)) return args;
  let i = 0;
  const result = [];
  for (const part of args[0]) {
    result.push(part);
    if (++i < args.length) result.push(args[i]);
  }
  return result;
};
