import { kebab } from '../common/dom.js';
import { isPlainObject, isTemplateCall, unwrapFn } from '../common/utils.js';
import { el } from '../realdom/index.js';
import { r } from '../reactivity/index.js';
import { escape, idStore, processMethodArgs, processNestedSelector, styleStr } from './utils.js';

// ─── Cons (persistent linked list) ────────────────────────────────────────
// `{ head, tail }` — head = most-recently-prepended item.
// cons: O(1) alloc. Walk head→tail: O(n). Never mutated.
export const cons = (head, tail) => ({ head, tail });

// ─── Module-local id stores ───────────────────────────────────────────────
const queryId = idStore();
const selectorId = idStore();
const plainStyleId = idStore();

// ─── Reactive detection + validation ──────────────────────────────────────

// O(args.length) — shallow scan; template literals are always static.
export const hasReactiveMethodArg = (args) => {
  if (args.length === 0) return false;
  if (isTemplateCall(args)) return false;
  for (const a of args) if (typeof a === 'function') return true;
  return false;
};

// O(Object.values(obj)) — one-level walk.
export const hasReactiveObjArg = (obj) => {
  if (typeof obj === 'function') return true;
  if (!isPlainObject(obj)) return false;
  for (const v of Object.values(obj)) if (typeof v === 'function') return true;
  return false;
};

// O(1) — throws on bad shape.
export const validateFromObjectArg = (obj) => {
  if (typeof obj === 'function' || isPlainObject(obj)) return obj;
  throw new Error(
    `FromObject expects plain object or function returning one; got ${
      obj === null ? 'null' : typeof obj
    }`
  );
};

// O(1) — step record; captures reactive flag for mount-time dispatch.
const makeStep = (methods, name, args) => {
  if (!methods[name]) throw new Error('method not found: ' + name);
  return {
    kind: 'method',
    name,
    method: methods[name],
    args,
    reactive: hasReactiveMethodArg(args),
  };
};

// ─── Context + WeakMap caches ─────────────────────────────────────────────
// Root context sentinel — identity-stable; WeakMap-compatible (object key).
export const ROOT_CTX = Object.freeze({
  selector: '',
  query: '',
  important: false,
  inline: false,
});

// parentCtx → WeakMap<modDescriptor, frozenDerivedCtx>. Mods are constructed
// at operator-call time, so their identity is stable across emit traversals.
const ctxCache = new WeakMap();

// step → WeakMap<ctx, StyleRule>. StyleRule identity stable; rebuild mutates
// fields so reactive effects and recalculate share the cache entry.
const ruleCache = new WeakMap();

// O(1) amortized (2 WeakMap lookups) + O(|selector|) on miss.
export const extendCtx = (parent, mod) => {
  let byMod = ctxCache.get(parent);
  if (!byMod) ctxCache.set(parent, byMod = new WeakMap());
  let ctx = byMod.get(mod);
  if (ctx) return ctx;
  const selector = mod.selector
    ? (parent.selector ? processNestedSelector(mod.selector, parent.selector) : mod.selector)
    : parent.selector;
  const query = mod.query || parent.query;
  const important = mod.important || parent.important;
  const inline = mod.inline || parent.inline;
  ctx = Object.freeze({ selector, query, important, inline });
  byMod.set(mod, ctx);
  return ctx;
};

// ─── StyleRule ────────────────────────────────────────────────────────────
// Materialized lazy rule. Identity stable under (step, ctx); `.rebuild()`
// mutates fields so _.recalculate() and reactive effects preserve identity.
class StyleRule {
  constructor(step, ctx) {
    this.step = step;
    this.ctx = ctx;
    this.classname = '';
    this.style = null;
    this.cls = '';
    this.css = null;
    this.additionalCss = null;
    this.inline = !!ctx.inline;
  }

  // O(|style|) + O(step-specific work). Mutates in place.
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
    } else {
      throw new Error('unknown step kind: ' + step.kind);
    }
    if (!this.style) { this.css = null; this.cls = ''; return; }
    this.cls = escape(
      (ctx.query ? '＠' + queryId(ctx.query) + ':' : '') +
      (ctx.selector ? '𝕊' + selectorId(ctx.selector) + ':' : '') +
      (this.classname ?? '') +
      (ctx.important ? 'ǃ' : '')
    );
    const sel = processNestedSelector(ctx.selector, '.' + this.cls);
    const body = sel + styleStr(this.style, ctx.important);
    this.css = ctx.query ? `${ctx.query} {${body}}` : body;
  }
}

// O(1) amortized — cache hit or single StyleRule alloc.
export const materialize = (step, ctx) => {
  let byCtx = ruleCache.get(step);
  if (!byCtx) ruleCache.set(step, byCtx = new WeakMap());
  let rule = byCtx.get(ctx);
  if (!rule) byCtx.set(ctx, rule = new StyleRule(step, ctx));
  return rule;
};

// ─── MethodChain (persistent) ─────────────────────────────────────────────
// `.steps` and `.pending` are cons-lists, head = newest.
// Getter fork: O(1) (one cons + one chain alloc); old chain untouched.
// Call drains pending into steps: O(k) for k pending names; returns fresh chain.
export const MethodChain = (methods) => {
  const proto = Object.create(null);

  for (const name of Object.keys(methods)) {
    Object.defineProperty(proto, name, {
      get() { return createChain(this.steps, cons(name, this.pending)); },
    });
  }

  const createChain = (steps, pending) => {
    const fn = function (...args) {
      if (fn.pending === null) return fn;
      const names = [];
      for (let p = fn.pending; p; p = p.tail) names.push(p.head);
      let next = fn.steps;
      for (let i = names.length - 1; i >= 0; i--) {
        next = cons(makeStep(methods, names[i], args), next);
      }
      return createChain(next, null);
    };
    fn.kind = 'chain';
    fn.steps = steps;
    fn.pending = pending;
    Object.setPrototypeOf(fn, proto);
    return fn;
  };

  return {
    proto,
    seed: (name) => createChain(null, cons(name, null)),
  };
};

// ─── emit ─────────────────────────────────────────────────────────────────
// Walk a cell tree; append `{ step, ctx, reactive }` tasks to `out`.
// O(n) in leaf-step count; O(depth) call stack for nested mods.
export const emit = (cell, ctx, out) => {
  if (cell == null || cell === false) return;
  if (Array.isArray(cell)) {
    for (const c of cell) emit(c, ctx, out);
    return;
  }
  switch (cell.kind) {
    case 'chain': {
      const arr = [];
      for (let s = cell.steps; s; s = s.tail) arr.push(s.head);
      for (let i = arr.length - 1; i >= 0; i--) {
        const step = arr[i];
        out.push({ step, ctx, reactive: step.reactive });
      }
      return;
    }
    case 'mod': {
      const next = extendCtx(ctx, cell.mod);
      for (const c of cell.children) emit(c, next, out);
      return;
    }
    case 'object':
      out.push({ step: cell, ctx, reactive: cell.reactive });
      return;
    case 'synth':
      cell.emitFn(ctx, out);
      return;
  }
  if (cell.nodes) emit(cell.nodes, ctx, out);
};

// ─── Mount ────────────────────────────────────────────────────────────────
// One outer effect (from el.ref). Each reactive step gets its own child
// r.effect — static steps register r.onCleanup on the parent. No deeper nesting.

const insertRuleDom = (styleSheet, dom, rule) => {
  if (rule.inline) {
    for (const [k, v] of Object.entries(rule.style)) dom.style.setProperty(kebab(k), v);
  } else {
    styleSheet.insertNode(rule);
    if (rule.cls) dom.classList.add(rule.cls);
  }
};

const removeRuleDom = (dom, rule) => {
  if (rule.inline) {
    for (const k of Object.keys(rule.style)) dom.style.removeProperty(kebab(k));
  } else if (rule.cls) {
    dom.classList.remove(rule.cls);
  }
};

export const makeMount = (styleSheet) => (cell) => el.ref((dom) => {
  const rules = [];
  emit(cell, ROOT_CTX, rules);
  for (const { step, ctx, reactive } of rules) {
    if (reactive) {
      r.effect(() => {
        const rule = materialize(step, ctx);
        rule.rebuild();
        insertRuleDom(styleSheet, dom, rule);
        return () => removeRuleDom(dom, rule);
      });
    } else {
      const rule = materialize(step, ctx);
      if (!rule.style) rule.rebuild();
      insertRuleDom(styleSheet, dom, rule);
      r.onCleanup(() => removeRuleDom(dom, rule));
    }
  }
});
