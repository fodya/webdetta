// @ts-self-types="./types/index.d.ts"
import { Element } from '../realdom/base.js';
import { MethodChain, makeMount } from './base.js';
import { Methods } from './methods.js';
import { makeOperators } from './operators.js';

const tryInsert = (sheet, css) => {
  try { sheet.insertRule(css, sheet.cssRules.length); } catch {}
};

// Keeps rule identity across _.recalculate (WeakMap cache → same StyleRule).
class StyleSheet {
  processedNodes = new Map();
  constructor(style) { this.style = style; }
  insertNode(rule) {
    const { cls, css, additionalCss } = rule;
    if (!cls || this.processedNodes.has(cls)) return;
    this.processedNodes.set(cls, rule);
    const sheet = this.style.sheet;
    if (css) tryInsert(sheet, css);
    if (additionalCss) tryInsert(sheet, additionalCss);
  }
  recalculate() {
    this.style.innerText = '';
    const rules = [...this.processedNodes.values()];
    this.processedNodes.clear();
    for (const rule of rules) { rule.rebuild(); this.insertNode(rule); }
  }
}

export const createVisuals = (cfg) => {
  const styleElem = document.head.appendChild(document.createElement('style'));
  const styleSheet = new StyleSheet(styleElem);
  const { methods } = Methods(cfg);
  const mount = makeMount(styleSheet);
  const chain = MethodChain(methods);
  chain.proto[Element.toNodes] = function () { return mount(this); };

  const proto = {
    _: { recalculate: () => styleSheet.recalculate(), styleSheet, mount },
    ...makeOperators(mount),
  };
  for (const name of Object.keys(methods)) {
    Object.defineProperty(proto, name, {
      enumerable: true,
      get() { return chain.seed(name); },
    });
  }
  return Object.create(proto);
};
