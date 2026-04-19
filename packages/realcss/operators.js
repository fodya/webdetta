// ─── Utils ────────────────────────────────────────────────────────────────
import { kebab } from '../common/dom.js';
import { unwrapFn } from '../common/utils.js';
import { Element } from '../realdom/base.js';
import { emit, materialize, ROOT_CTX, validatePlainArg } from './base.js';
import { idStore, styleStr } from './utils.js';

const transitionId = idStore();
const keyframeId = idStore();
const animationId = idStore();

// Materialize child-tree into merged style object (called inside r.effect scope).
const collectStyle = (nodes) => {
  const out = [];
  emit(nodes, ROOT_CTX, out);
  const style = {};
  for (const { step, ctx } of out) {
    const sub = materialize(step, ctx);
    sub.rebuild();
    if (sub.style) Object.assign(style, sub.style);
  }
  return style;
};

// ─── Synth factories ──────────────────────────────────────────────────────
const transitionSynth = (param, children) => ({
  kind: 'synth',
  emitFn(ctx, out) {
    for (const c of children) emit(c, ctx, out);
    out.push({ ctx, step: { kind: 'synth-transition', build(rule) {
      const style = collectStyle(children);
      const keys = Object.keys(style);
      const p = unwrapFn(param);
      rule.classname = '𝕋' + transitionId(p + keys.join(',')) + ':';
      rule.style = { transition: keys.map((k) => p + ' ' + kebab(k)).join(',') };
    } } });
  },
});

const animationSynth = (param, keyframes) => ({
  kind: 'synth',
  emitFn(ctx, out) {
    out.push({ ctx, step: { kind: 'synth-animation', build(rule) {
      const str = Object.entries(keyframes)
        .map(([k, v]) => k + '% ' + styleStr(collectStyle(v), false))
        .join('\n');
      const kfId = keyframeId(str);
      const p = unwrapFn(param);
      rule.classname = '𝔸' + animationId(p + kfId) + ':';
      rule.additionalCss = `@keyframes 𝔸${kfId} {\n${str}\n}`;
      rule.style = { animation: p + ' 𝔸' + kfId };
    } } });
  },
});

// ─── makeOperators ────────────────────────────────────────────────────────
export const makeOperators = (mount) => {
  const wrap = (cell) => {
    cell[Element.toNodes] = function () { return mount(cell); };
    return cell;
  };

  return {
    Plain: (obj) => wrap({ kind: 'object', obj: validatePlainArg(obj) }),
    Select: (val, ...children) => wrap({ kind: 'mod', mod: { selector: val }, children }),
    Query: (val, ...children) => wrap({ kind: 'mod', mod: { query: val }, children }),
    Important: (...children) => wrap({ kind: 'mod', mod: { important: true }, children }),
    Inline: (...children) => wrap({ kind: 'mod', mod: { inline: true }, children }),
    Transition: (param, ...children) => wrap(transitionSynth(param, children)),
    Animation: (param, keyframes) => wrap(animationSynth(param, keyframes)),
  };
};
