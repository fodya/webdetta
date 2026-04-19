// ─── Utils ────────────────────────────────────────────────────────────────
import { kebab } from '../common/dom.js';
import { unwrapFn } from '../common/utils.js';
import { Element } from '../realdom/base.js';
import {
  emit, hasReactiveObjArg, materialize, ROOT_CTX, validateFromObjectArg,
} from './base.js';
import { idStore, styleStr } from './utils.js';

const transitionId = idStore();
const keyframeId = idStore();
const animationId = idStore();

// ─── Synth factories ──────────────────────────────────────────────────────
// Transition/Animation cells carry a custom `emitFn` that fans children into
// the rule stream and pushes a reactive aggregator step whose `build` reads
// child styles (signal-tracked via materialize+rebuild inside the effect).

const transitionSynth = (param, children) => ({
  kind: 'synth',
  param,
  children,
  emitFn(ctx, out) {
    for (const c of children) emit(c, ctx, out);
    const step = {
      kind: 'synth-transition',
      param,
      children,
      reactive: true,
      build(rule) {
        const subOut = [];
        emit(children, ROOT_CTX, subOut);
        const style = {};
        for (const { step: s, ctx: c } of subOut) {
          const sub = materialize(s, c);
          sub.rebuild();
          if (sub.style) Object.assign(style, sub.style);
        }
        const keys = Object.keys(style);
        const paramVal = unwrapFn(param);
        rule.classname = '𝕋' + transitionId(paramVal + keys.join(',')) + ':';
        rule.style = {
          transition: keys.map((k) => paramVal + ' ' + kebab(k)).join(','),
        };
      },
    };
    out.push({ step, ctx, reactive: true });
  },
});

const animationSynth = (param, keyframes) => ({
  kind: 'synth',
  param,
  keyframes,
  emitFn(ctx, out) {
    const step = {
      kind: 'synth-animation',
      param,
      keyframes,
      reactive: true,
      build(rule) {
        const str = Object.entries(keyframes).map(([ident, value]) => {
          const subOut = [];
          emit(value, ROOT_CTX, subOut);
          const style = {};
          for (const { step: s, ctx: c } of subOut) {
            const sub = materialize(s, c);
            sub.rebuild();
            if (sub.style) Object.assign(style, sub.style);
          }
          return ident + '% ' + styleStr(style, false);
        }).join('\n');
        const kfId = keyframeId(str);
        const paramVal = unwrapFn(param);
        const aId = animationId(paramVal + kfId);
        rule.classname = '𝔸' + aId + ':';
        rule.additionalCss = `@keyframes 𝔸${kfId} {\n${str}\n}`;
        rule.style = { animation: paramVal + ' 𝔸' + kfId };
      },
    };
    out.push({ step, ctx, reactive: true });
  },
});

// ─── makeOperators ────────────────────────────────────────────────────────
// Instance-bound factory: closes over the per-visuals `mount` so each
// returned cell exposes `[Element.toNodes]` tied to the right stylesheet.

export const makeOperators = (mount) => {
  const wrap = (cell) => {
    cell[Element.toNodes] = function () { return mount(cell); };
    return cell;
  };

  return {
    FromObject: (obj) => wrap({
      kind: 'object',
      obj: validateFromObjectArg(obj),
      reactive: hasReactiveObjArg(obj),
    }),

    Select: (selector, ...children) => wrap({
      kind: 'mod',
      mod: { selector },
      children,
    }),

    Query: (query, ...children) => wrap({
      kind: 'mod',
      mod: { query },
      children,
    }),

    Important: (...children) => wrap({
      kind: 'mod',
      mod: { important: true },
      children,
    }),

    Inline: (...children) => wrap({
      kind: 'mod',
      mod: { inline: true },
      children,
    }),

    Transition: (param, ...children) => wrap(transitionSynth(param, children)),

    Animation: (param, keyframes) => wrap(animationSynth(param, keyframes)),
  };
};
