// @ts-self-types="./types/index.d.ts"
import { Element } from '../realdom/base.js';
import { MethodChain, makeMount } from './base.js';
import { Methods } from './methods.js';
import { makeOperators } from './operators.js';

// StyleSheet stores materialized rules by cls. Recalculate preserves each
// rule's identity (same WeakMap cache hit on re-mount); only `.css` is refreshed.
class StyleSheet {
  processedNodes = new Map();
  constructor(style) { this.style = style; }
  insertNode(rule) {
    const { cls, css, additionalCss } = rule;
    if (!cls || this.processedNodes.has(cls)) return;
    const stylesheet = this.style.sheet;
    this.processedNodes.set(cls, rule);
    if (css) {
      try { stylesheet.insertRule(css, stylesheet.cssRules.length); }
      catch (e) {}
    }
    if (additionalCss) {
      try { stylesheet.insertRule(additionalCss, stylesheet.cssRules.length); }
      catch (e) {}
    }
  }
  recalculate() {
    this.style.innerText = '';
    const rules = [...this.processedNodes.values()];
    this.processedNodes.clear();
    for (const rule of rules) {
      rule.rebuild();
      this.insertNode(rule);
    }
  }
}

export const createVisuals = (cfg) => {
  const styleElem = document.createElement('style');
  document.head.appendChild(styleElem);
  const styleSheet = new StyleSheet(styleElem);
  const { methods } = Methods(cfg);
  const mount = makeMount(styleSheet);
  const chain = MethodChain(methods);
  chain.proto[Element.toNodes] = function () { return mount(this); };

  const operators = makeOperators(mount);

  const rootProto = {};
  rootProto._ = {
    recalculate: () => styleSheet.recalculate(),
    styleSheet,
    mount,
  };
  for (const name of Object.keys(methods)) {
    Object.defineProperty(rootProto, name, {
      enumerable: true,
      get() { return chain.seed(name); },
    });
  }
  for (const [name, operator] of Object.entries(operators)) {
    rootProto[name] = operator;
  }

  return Object.create(rootProto);
};
