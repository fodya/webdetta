/**
 * Expressive DSL syntax using builder pattern
 * @example ./examples/index.example.js
 * @module
 */
/**
 * @typedef {Object} BuilderTask
 * @property {string[]} names
 * @property {unknown[]} args
 */

/**
 * @typedef {function(BuilderTask[], ...unknown[]): unknown} BuilderEffect
 */

/**
 * @typedef {Object} BuilderFn
 * @property {(...args: unknown[]) => BuilderFn} [key]
 */

/**
 * @type {{
 *   (effect: BuilderEffect, tasks?: BuilderTask[], names?: string[]): BuilderFn,
 *   symbol: symbol,
 *   isBuilder(f: unknown): boolean,
 *   launch(f: BuilderFn, ...args: unknown[]): unknown
 * }}
 */
export const Builder = (effect, tasks = [], names = []) => {
  const call = (...args) => {
    if (args[0] === Builder.symbol) return (args[0] = tasks, effect(...args));
    return Builder(effect, [...tasks, { names, args }], []);
  };
  const get = (_, k) => {
    if (typeof k === "symbol") return effect[k];
    return Builder(effect, tasks, [...names, k]);
  };
  call[Builder.symbol] = true;
  return new Proxy(call, { get });
};

Builder.symbol = Symbol("Builder.symbol");
Builder.isBuilder = (f) => f && Object.hasOwn(f, Builder.symbol);
Builder.launch = (f, ...args) => f(Builder.symbol, ...args);
