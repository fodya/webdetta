import { kebab } from '../common/dom.js';
import { isPlainObject, unwrapFn } from '../common/utils.js';
import { el } from '../realdom/index.js';
import { r } from '../reactivity/index.js';
import { escape, idStore, processMethodArgs, processNestedSelector, styleStr } from './utils.js';

// Persistent cons. O(1) prepend, O(n) walk, never mutated.
export const cons = (head, tail) => ({ head, tail });

const queryId = idStore();
const selectorId = idStore();
const plainStyleId = idStore();

export const validateFromObjectArg = (obj) => {
  if (typeof obj === 'function' || isPlainObject(obj)) return obj;
  throw new Error(
    `FromObject expects plain object or function; got ${obj === null ? 'null' : typeof obj}`,
  );
};

export const ROOT_CTX = Object.freeze({ selector: '', query: '', important: false, inline: false });

const ctxCache = new WeakMap();   // parent → WeakMap<mod, ctx>
const ruleCache = new WeakMap();  // step   → WeakMap<ctx, StyleRule>

// O(1) amortized + O(|selector|) on cache miss.
export const extendCtx = (parent, mod) => {
  let byMod = ctxCache.get(parent);
  if (!byMod) ctxCache.set(parent, byMod = new WeakMap());
  let ctx = byMod.get(mod);
  if (ctx) return ctx;
  ctx = Object.freeze({
    selector: mod.selector
      ? (parent.selector ? processNestedSelector(mod.selector, parent.selector) : mod.selector)
      : parent.selector,
    query: mod.query || parent.query,
    important: mod.important || parent.important,
    inline: mod.inline || parent.inline,
  });
  byMod.set(mod, ctx);
  return ctx;
};

// Materialized rule; identity stable under (step, ctx). rebuild() mutates.
class StyleRule {
  classname = ''; style = null; cls = '';
  css = null; additionalCss = null;
  constructor(step, ctx) {
    this.step = step; this.ctx = ctx; this.inline = !!ctx.inline;
  }
  rebuild() {
    const { step, ctx } = this;
    this.additionalCss = null;
    if (step.kind === 'method') {
      const args = processMethodArgs(step.args);
      this.classname = step.name + '(' + args.join(',') + ')';
      this.style = step.method(...args);
    } else if (step.kind === 'object') {
      const raw = unwrapFn(step.obj);
      const style = {};
      for (const [k, v] of Object.entries(raw)) style[k] = unwrapFn(v);
      this.style = style;
      this.classname = '𝕀' + plainStyleId(JSON.stringify(style)) + ':';
    } else if (typeof step.build === 'function') {
      step.build(this);
    } else throw new Error('unknown step kind: ' + step.kind);
    if (!this.style) { this.css = null; this.cls = ''; return; }
    this.cls = escape(
      (ctx.query ? '＠' + queryId(ctx.query) + ':' : '') +
      (ctx.selector ? '𝕊' + selectorId(ctx.selector) + ':' : '') +
      (this.classname ?? '') +
      (ctx.important ? 'ǃ' : ''),
    );
    const body = processNestedSelector(ctx.selector, '.' + this.cls) + styleStr(this.style, ctx.important);
    this.css = ctx.query ? `${ctx.query} {${body}}` : body;
  }
}

// O(1) amortized — WeakMap hit or single alloc.
export const materialize = (step, ctx) => {
  let byCtx = ruleCache.get(step);
  if (!byCtx) ruleCache.set(step, byCtx = new WeakMap());
  let rule = byCtx.get(ctx);
  if (!rule) byCtx.set(ctx, rule = new StyleRule(step, ctx));
  return rule;
};

// Persistent chain. Getter: O(1) fork. Call: O(k) drain pending into steps.
export const MethodChain = (methods) => {
  const proto = Object.create(null);
  for (const name of Object.keys(methods)) {
    Object.defineProperty(proto, name, {
      get() { return createChain(this.steps, cons(name, this.pending)); },
    });
  }
  const createChain = (steps, pending) => {
    const fn = function (...args) {
      if (!fn.pending) return fn;
      const names = [];
      for (let p = fn.pending; p; p = p.tail) names.push(p.head);
      let next = fn.steps;
      for (let i = names.length - 1; i >= 0; i--) {
        const name = names[i];
        next = cons({ kind: 'method', name, method: methods[name], args }, next);
      }
      return createChain(next, null);
    };
    fn.kind = 'chain'; fn.steps = steps; fn.pending = pending;
    Object.setPrototypeOf(fn, proto);
    return fn;
  };
  return { proto, seed: (name) => createChain(null, cons(name, null)) };
};

// Walk cell tree; append {step, ctx} to `out`. O(n) leaf-steps, O(depth) stack.
export const emit = (cell, ctx, out) => {
  if (cell == null || cell === false) return;
  if (Array.isArray(cell)) { for (const c of cell) emit(c, ctx, out); return; }
  switch (cell.kind) {
    case 'chain': {
      const arr = [];
      for (let s = cell.steps; s; s = s.tail) arr.push(s.head);
      for (let i = arr.length - 1; i >= 0; i--) out.push({ step: arr[i], ctx });
      return;
    }
    case 'mod': {
      const next = extendCtx(ctx, cell.mod);
      for (const c of cell.children) emit(c, next, out);
      return;
    }
    case 'object': out.push({ step: cell, ctx }); return;
    case 'synth': cell.emitFn(ctx, out); return;
  }
  if (cell.nodes) emit(cell.nodes, ctx, out);
};

// Mount: one el.ref effect; per-step child r.effect. Static steps auto-untrack
// after first run (Effect drops tracking when no signals were read).
export const makeMount = (styleSheet) => (cell) => el.ref((dom) => {
  const insert = (rule) => {
    if (rule.inline) {
      for (const [k, v] of Object.entries(rule.style)) dom.style.setProperty(kebab(k), v);
    } else {
      styleSheet.insertNode(rule);
      if (rule.cls) dom.classList.add(rule.cls);
    }
  };
  const remove = (rule) => {
    if (rule.inline) {
      for (const k of Object.keys(rule.style)) dom.style.removeProperty(kebab(k));
    } else if (rule.cls) dom.classList.remove(rule.cls);
  };
  const rules = [];
  emit(cell, ROOT_CTX, rules);
  for (const { step, ctx } of rules) {
    r.effect(() => {
      const rule = materialize(step, ctx);
      rule.rebuild();
      insert(rule);
      return () => remove(rule);
    });
  }
});
