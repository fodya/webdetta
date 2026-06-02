/**
 * Pure javascript DSL for generating CSS at runtime with no build step
 * @example ./examples/index.example.js
 * @module
 */
/**
 * @typedef {import('./methods.js').MethodConfigEntry} MethodConfigEntry
 * @typedef {import('./methods.js').MethodFn} MethodFn
 * @typedef {import('./methods.js').MethodsConfig} MethodsConfig
 * @typedef {import('./methods.js').MethodsMap} MethodsMap
 * @typedef {import('./methods.js').MethodsResolver} MethodsResolver
 * @typedef {import('./methods.js').MethodsResolvers} MethodsResolvers
 */

/**
 * @template T
 * @typedef {Object} Cons
 * @property {T} head
 * @property {Cons<T> | null} tail
 */

/**
 * @typedef {Object} MethodStep
 * @property {"method"} kind
 * @property {string} name
 * @property {(...args: unknown[]) => Record<string, unknown>} method
 * @property {unknown[]} args
 */

/**
 * @typedef {Object} Ctx
 * @property {string} selector
 * @property {string} query
 * @property {boolean} important
 * @property {boolean} inline
 */

/**
 * @typedef {Object} StyleRule
 * @property {unknown} step
 * @property {Ctx} ctx
 * @property {string} classname
 * @property {Record<string, unknown> | null} style
 * @property {string} cls
 * @property {string | null} css
 * @property {string | null} additionalCss
 * @property {boolean} inline
 * @property {() => void} rebuild
 */

/**
 * @typedef {Object} StyleSheet
 * @property {HTMLStyleElement} style
 * @property {Map<string, StyleRule>} processedNodes
 * @property {(rule: StyleRule) => void} insertNode
 * @property {() => void} recalculate
 */

/**
 * @typedef {Object} VisualsUtils
 * @property {() => void} recalculate
 * @property {StyleSheet} styleSheet
 * @property {(cell: Cell) => unknown} mount
 */

/**
 * @typedef {Object} ObjectCell
 * @property {"object"} kind
 * @property {Record<string, unknown> | (() => Record<string, unknown>)} obj
 */

/**
 * @typedef {Object} ModCell
 * @property {"mod"} kind
 * @property {{ selector?: string | ((parent: string) => string); query?: string; important?: boolean; inline?: boolean }} mod
 * @property {readonly Cell[]} children
 */

/**
 * @typedef {Object} RuleTask
 * @property {unknown} step
 * @property {Ctx} ctx
 */

/**
 * @typedef {Object} SynthCell
 * @property {"synth"} kind
 * @property {(ctx: Ctx, out: RuleTask[]) => void} emitFn
 */

/**
 * @typedef {MethodChain | ObjectCell | ModCell | SynthCell} Cell
 */

/**
 * @template {MethodsMap} [M=MethodsMap]
 * @typedef {((...args: unknown[]) => MethodChainWithMethods<M>) & {
 *   kind: "chain",
 *   steps: Cons<MethodStep> | null,
 *   pending: Cons<string> | null
 * }} MethodChain
 */

/**
 * @template {MethodsMap} M
 * @typedef {MethodChain<M> & {[K in keyof M]: MethodChainWithMethods<M>}} MethodChainWithMethods
 */

/**
 * @template {MethodsMap} [M=MethodsMap]
 * @typedef {Object} Root
 * @property {VisualsUtils} $
 * @property {(style: Record<string, unknown> | (() => Record<string, unknown>)) => ObjectCell} Plain
 * @property {(selector: string | ((parent: string) => string), ...children: Cell[]) => ModCell} Select
 * @property {(query: string, ...children: Cell[]) => ModCell} Query
 * @property {(...children: Cell[]) => ModCell} Important
 * @property {(...children: Cell[]) => ModCell} Inline
 * @property {(param: string | (() => string), ...children: Cell[]) => SynthCell} Transition
 * @property {(param: string | (() => string), keyframes: Record<string, Cell | Cell[]>) => SynthCell} Animation
 */

/**
 * @template {MethodsMap} M
 * @typedef {Root<M> & Record<keyof M, MethodChainWithMethods<M>>} RootWithMethods
 */

import { Element } from "@webdetta/realdom/base";
import { makeMount, MethodChain } from "./base.js";
import { Methods } from "./methods.js";
import { makeOperators } from "./operators.js";

/**
 * @param {import('./methods.js').MethodsConfig} cfg
 * @returns {{ methods: import('./methods.js').MethodsMap, resolve: import('./methods.js').MethodsResolvers }}
 */
export { Methods } from "./methods.js";

const tryInsert = (sheet, css) => {
  try {
    sheet.insertRule(css, sheet.cssRules.length);
  } catch { /**/ }
};

class StyleSheetImpl {
  processedNodes = new Map();
  constructor(style) {
    this.style = style;
  }
  insertNode(rule) {
    const { cls, css, additionalCss } = rule;
    if (!cls || this.processedNodes.has(cls)) return;
    this.processedNodes.set(cls, rule);
    const sheet = this.style.sheet;
    if (css) tryInsert(sheet, css);
    if (additionalCss) tryInsert(sheet, additionalCss);
  }
  recalculate() {
    this.style.innerText = "";
    const rules = [...this.processedNodes.values()];
    this.processedNodes.clear();
    for (const rule of rules) {
      rule.rebuild();
      this.insertNode(rule);
    }
  }
}

/**
 * @template {MethodsMap} [M=MethodsMap]
 * @param {MethodsConfig} cfg
 * @returns {RootWithMethods<M>}
 */
export const Visuals = (cfg) => {
  const styleElem = document.head.appendChild(document.createElement("style"));
  const styleSheet = new StyleSheetImpl(styleElem);
  const { methods } = Methods(cfg);
  const mount = makeMount(styleSheet);
  const chain = MethodChain(methods);
  chain.proto[Element.lazy] = function () {
    return mount(this);
  };

  const proto = {
    $: { recalculate: () => styleSheet.recalculate(), styleSheet, mount },
    ...makeOperators(mount),
  };
  for (const name of Object.keys(methods)) {
    Object.defineProperty(proto, name, {
      enumerable: true,
      get() {
        return chain.seed(name);
      },
    });
  }
  return Object.create(proto);
};
