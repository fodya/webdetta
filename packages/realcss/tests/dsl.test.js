import { describe, it, beforeEach, afterEach } from 'jsr:@std/testing/bdd';
import { assert, assertEquals, assertThrows } from 'jsr:@std/assert';
import { JSDOM } from 'npm:jsdom';
import { arr, objectPick } from '../../common/utils.js';

const DOM_GLOBALS = arr`window document Node HTMLElement CSSStyleDeclaration CSS`;

let createVisuals;
let Element;
let el;
let emit;
let ROOT_CTX;
let materialize;
let extendCtx;
let origGlobals;

const setupDom = async () => {
  const window = new JSDOM('<!doctype html><html><head></head><body></body></html>').window;
  origGlobals = {};
  for (const k of DOM_GLOBALS) origGlobals[k] = globalThis[k];
  Object.assign(globalThis, objectPick(window, DOM_GLOBALS));
  if (!globalThis.CSS) globalThis.CSS = { escape: (s) => String(s).replace(/[^\w-]/g, '_') };
  ({ createVisuals } = await import('../index.js'));
  ({ Element } = await import('../../realdom/base.js'));
  ({ el } = await import('../../realdom/index.js'));
  ({ emit, ROOT_CTX, materialize, extendCtx } = await import('../base.js'));
};

const teardownDom = () => {
  globalThis.window?.close?.();
  for (const k of DOM_GLOBALS) {
    if (origGlobals[k] === undefined) delete globalThis[k];
    else globalThis[k] = origGlobals[k];
  }
};

const baseCfg = { unit: [1, 'rem'] };

// Walk a cons list into an array head→tail.
const consToArray = (node) => {
  const out = [];
  for (let n = node; n; n = n.tail) out.push(n.head);
  return out;
};

// Collect emitted rule tasks.
const collect = (cell) => {
  const out = [];
  emit(cell, ROOT_CTX, out);
  return out;
};

describe('realcss DSL v2', () => {
  beforeEach(setupDom);
  afterEach(teardownDom);

  describe('root (v)', () => {
    it('exposes service handle under _', () => {
      const v = createVisuals(baseCfg);
      assert(typeof v._.recalculate === 'function');
      assert(v._.styleSheet);
      assert(typeof v._.mount === 'function');
    });

    it('is not callable — typeof v is object', () => {
      const v = createVisuals(baseCfg);
      assertEquals(typeof v, 'object');
      assertThrows(() => v({ color: 'red' }), TypeError);
      assertThrows(() => v(() => ({ color: 'red' })), TypeError);
    });

    it('does NOT expose v.Sel (breaking: use v.Select)', () => {
      const v = createVisuals(baseCfg);
      assertEquals(v.Sel, undefined);
    });

    it('methods are getters returning callable chains', () => {
      const v = createVisuals(baseCfg);
      const chain = v.tc;
      assertEquals(typeof chain, 'function');
      assertEquals(chain.kind, 'chain');
      assertEquals(chain.steps, null);
      assertEquals(consToArray(chain.pending), ['tc']);
    });

    it('exposes FromObject/Select/Query/Important/Inline/Transition/Animation', () => {
      const v = createVisuals(baseCfg);
      for (const name of ['FromObject', 'Select', 'Query', 'Important', 'Inline', 'Transition', 'Animation']) {
        assertEquals(typeof v[name], 'function', `v.${name} must be a function`);
      }
    });

    it('root does NOT expose Element.toNodes', () => {
      const v = createVisuals(baseCfg);
      assertEquals(v[Element.toNodes], undefined);
    });
  });

  describe('methodChain — persistence', () => {
    it('v.<method> births a FRESH chain every access', () => {
      const v = createVisuals(baseCfg);
      assert(v.tc !== v.tc, 'each root getter access yields a new chain');
    });

    it('fork: a = v.tc; b = a.p; c = a.m — distinct instances, shared prefix', () => {
      const v = createVisuals(baseCfg);
      const a = v.tc;
      const b = a.p;
      const c = a.m;
      assert(a !== b && a !== c && b !== c);
      assertEquals(consToArray(a.pending), ['tc']);
      assertEquals(consToArray(b.pending), ['p', 'tc']);
      assertEquals(consToArray(c.pending), ['m', 'tc']);
    });

    it('getters do not mutate the source chain', () => {
      const v = createVisuals(baseCfg);
      const a = v.tc;
      const aPending = a.pending;
      a.p;
      a.m.h;
      assertEquals(a.pending, aPending);
    });

    it('O(1) fork: getter allocates exactly one cons for pending', () => {
      const v = createVisuals(baseCfg);
      const a = v.tc;
      const b = a.p;
      assert(b.pending.tail === a.pending, 'new pending shares tail with source');
    });

    it('call-per-step: v.tc("red").p(1) accumulates two steps', () => {
      const v = createVisuals(baseCfg);
      const chain = v.tc('red').p(1);
      const steps = consToArray(chain.steps);
      assertEquals(steps.length, 2);
      assertEquals(chain.pending, null);
      // head is newest = p; oldest = tc (at tail)
      assertEquals(steps[0].name, 'p');
      assertEquals(steps[1].name, 'tc');
    });

    it('accumulator: v.tc.p("red") flushes both names with same args', () => {
      const v = createVisuals(baseCfg);
      const chain = v.tc.p('red');
      const steps = consToArray(chain.steps);
      assertEquals(steps.length, 2);
      assertEquals(chain.pending, null);
      assertEquals(steps[0].name, 'p');
      assertEquals(steps[1].name, 'tc');
      assertEquals(steps[0].args, ['red']);
      assertEquals(steps[1].args, ['red']);
    });

    it('mixed: v.tc("red").p.m(1) — immediate then accumulator', () => {
      const v = createVisuals(baseCfg);
      const chain = v.tc('red').p.m(1);
      const steps = consToArray(chain.steps);
      assertEquals(steps.length, 3);
      assertEquals(steps.map(s => s.name), ['m', 'p', 'tc']);
    });

    it('calling with empty pending is a no-op (returns self)', () => {
      const v = createVisuals(baseCfg);
      const chain = v.tc('red');
      assert(chain('ignored') === chain);
    });

    it('operators and FromObject are NOT on the chain prototype', () => {
      const v = createVisuals(baseCfg);
      const chain = v.tc;
      assertEquals(chain.Select, undefined);
      assertEquals(chain.FromObject, undefined);
      assertEquals(chain.Important, undefined);
      assertEquals(chain.Query, undefined);
      assertEquals(chain.Transition, undefined);
    });

    it('tagged-template call works: v.col`c t`', () => {
      const v = createVisuals(baseCfg);
      const chain = v.col`c t`;
      const steps = consToArray(chain.steps);
      assertEquals(steps.length, 1);
      assertEquals(steps[0].name, 'col');
    });

    it('factory reuse: each btnBase() call yields an independent chain', () => {
      const v = createVisuals(baseCfg);
      const btnBase = () => v.row`c c`.flex`1`.mnh`6`.ph`4`;
      const a = btnBase();
      const b = btnBase();
      assert(a !== b);
      assertEquals(consToArray(a.steps).length, 4);
      assertEquals(consToArray(b.steps).length, 4);
    });
  });

  describe('reactive detection', () => {
    it('chain step with function arg is reactive', () => {
      const v = createVisuals(baseCfg);
      const chain = v.bg(() => 'red');
      const step = chain.steps.head;
      assertEquals(step.reactive, true);
    });

    it('chain step with only static args is NOT reactive', () => {
      const v = createVisuals(baseCfg);
      const chain = v.bg('red').tc('blue').p(1);
      for (const step of consToArray(chain.steps)) {
        assertEquals(step.reactive, false, `step.${step.name} should not be reactive`);
      }
    });

    it('tagged-template chain is NOT reactive', () => {
      const v = createVisuals(baseCfg);
      const chain = v.col`c t`.mnh`f`.w`f`;
      for (const step of consToArray(chain.steps)) {
        assertEquals(step.reactive, false);
      }
    });

    it('FromObject(plain) is NOT reactive', () => {
      const v = createVisuals(baseCfg);
      const cell = v.FromObject({ color: 'red' });
      assertEquals(cell.reactive, false);
    });

    it('FromObject(fn) IS reactive', () => {
      const v = createVisuals(baseCfg);
      const cell = v.FromObject(() => ({ color: 'red' }));
      assertEquals(cell.reactive, true);
    });

    it('FromObject({ k: fn }) IS reactive (shallow)', () => {
      const v = createVisuals(baseCfg);
      const cell = v.FromObject({ color: () => 'red' });
      assertEquals(cell.reactive, true);
    });
  });

  describe('FromObject validation', () => {
    it('accepts plain object', () => {
      const v = createVisuals(baseCfg);
      const cell = v.FromObject({ color: 'red' });
      assertEquals(cell.kind, 'object');
    });

    it('accepts function', () => {
      const v = createVisuals(baseCfg);
      const fn = () => ({ color: 'red' });
      const cell = v.FromObject(fn);
      assertEquals(cell.obj, fn);
    });

    it('rejects string', () => {
      const v = createVisuals(baseCfg);
      assertThrows(() => v.FromObject('nope'));
    });

    it('rejects number', () => {
      const v = createVisuals(baseCfg);
      assertThrows(() => v.FromObject(42));
    });

    it('rejects null', () => {
      const v = createVisuals(baseCfg);
      assertThrows(() => v.FromObject(null));
    });

    it('rejects arrays (not plain objects)', () => {
      const v = createVisuals(baseCfg);
      assertThrows(() => v.FromObject([{ color: 'red' }]));
    });
  });

  describe('operators — shape', () => {
    it('Select wraps children into a mod cell', () => {
      const v = createVisuals(baseCfg);
      const cell = v.Select('& > a', v.tc('red'));
      assertEquals(cell.kind, 'mod');
      assertEquals(cell.mod.selector, '& > a');
      assertEquals(cell.children.length, 1);
    });

    it('Query wraps children under an at-rule', () => {
      const v = createVisuals(baseCfg);
      const cell = v.Query('@media (min-width: 40em)', v.tc('red'));
      assertEquals(cell.kind, 'mod');
      assertEquals(cell.mod.query, '@media (min-width: 40em)');
    });

    it('Important marks children', () => {
      const v = createVisuals(baseCfg);
      const cell = v.Important(v.tc('red'), v.p(1));
      assertEquals(cell.mod.important, true);
      assertEquals(cell.children.length, 2);
    });

    it('Inline marks children', () => {
      const v = createVisuals(baseCfg);
      const cell = v.Inline(v.tc('red'));
      assertEquals(cell.mod.inline, true);
    });

    it('operator O(1): Select with N child chains keeps N refs (no walk)', () => {
      const v = createVisuals(baseCfg);
      const chains = [];
      for (let i = 0; i < 100; i++) chains.push(v.tc('c' + i));
      const cell = v.Select('&', ...chains);
      assertEquals(cell.children.length, 100);
      for (let i = 0; i < chains.length; i++) {
        assert(cell.children[i] === chains[i], 'child ref identity preserved');
      }
    });
  });

  describe('emit — lazy O(n) materialization', () => {
    it('chain emits one task per step, in insertion order', () => {
      const v = createVisuals(baseCfg);
      const out = collect(v.tc('red').p(1));
      assertEquals(out.length, 2);
      assertEquals(out[0].step.name, 'tc');
      assertEquals(out[1].step.name, 'p');
    });

    it('static chain emits zero reactive tasks', () => {
      const v = createVisuals(baseCfg);
      const out = collect(v.bg('red').tc('blue').p(1));
      const reactive = out.filter(r => r.reactive);
      assertEquals(reactive.length, 0);
    });

    it('reactive chain emits one reactive task per reactive step', () => {
      const v = createVisuals(baseCfg);
      const out = collect(v.bg(() => 'red').tc('blue'));
      const reactive = out.filter(r => r.reactive);
      assertEquals(reactive.length, 1);
      assertEquals(reactive[0].step.name, 'bg');
    });

    it('Select composes ctx: ctx.selector applied to children', () => {
      const v = createVisuals(baseCfg);
      const cell = v.Select('& > a', v.tc('red'), v.p(1));
      const out = collect(cell);
      assertEquals(out.length, 2);
      for (const { ctx } of out) assertEquals(ctx.selector, '& > a');
    });

    it('Important composes ctx: ctx.important = true', () => {
      const v = createVisuals(baseCfg);
      const cell = v.Important(v.tc('red'));
      const out = collect(cell);
      assertEquals(out[0].ctx.important, true);
    });

    it('nested: Select(":hover", Important(chain)) composes both', () => {
      const v = createVisuals(baseCfg);
      const cell = v.Select('&:hover', v.Important(v.tc('red')));
      const out = collect(cell);
      assertEquals(out.length, 1);
      assertEquals(out[0].ctx.selector, '&:hover');
      assertEquals(out[0].ctx.important, true);
    });

    it('FromObject emits exactly one task', () => {
      const v = createVisuals(baseCfg);
      const cell = v.FromObject({ color: 'red' });
      const out = collect(cell);
      assertEquals(out.length, 1);
      assertEquals(out[0].step, cell);
    });

    it('Transition emits children + one reactive aggregator', () => {
      const v = createVisuals(baseCfg);
      const cell = v.Transition('0.3s ease', v.tc('red'), v.p(1));
      const out = collect(cell);
      assertEquals(out.length, 3);
      assertEquals(out[out.length - 1].reactive, true);
    });

    it('Animation emits a single reactive keyframed aggregator', () => {
      const v = createVisuals(baseCfg);
      const cell = v.Animation('1s linear', {
        0: v.tc('red'),
        100: v.tc('blue'),
      });
      const out = collect(cell);
      assertEquals(out.length, 1);
      assertEquals(out[0].reactive, true);
    });
  });

  describe('extendCtx + materialize — identity caches', () => {
    it('extendCtx returns identity-stable ctx per (parent, mod)', () => {
      const mod = { selector: '&:hover' };
      const a = extendCtx(ROOT_CTX, mod);
      const b = extendCtx(ROOT_CTX, mod);
      assert(a === b);
    });

    it('extendCtx composes selector with parent', () => {
      const parent = extendCtx(ROOT_CTX, { selector: '& .foo' });
      const child = extendCtx(parent, { selector: '&:hover' });
      assertEquals(child.selector, '& .foo:hover');
    });

    it('materialize(step, ctx) returns identity-stable StyleRule', () => {
      const v = createVisuals(baseCfg);
      const chain = v.tc('red');
      const { step, ctx } = collect(chain)[0];
      const r1 = materialize(step, ctx);
      const r2 = materialize(step, ctx);
      assert(r1 === r2);
    });

    it('rebuild mutates in place — StyleRule identity preserved', () => {
      const v = createVisuals(baseCfg);
      const chain = v.tc('red');
      const { step, ctx } = collect(chain)[0];
      const rule = materialize(step, ctx);
      rule.rebuild();
      const before = rule;
      rule.rebuild();
      assert(rule === before);
      assertEquals(rule.style?.color, 'red');
    });
  });

  describe('Element.toNodes — mountability', () => {
    it('chain is mountable', () => {
      const v = createVisuals(baseCfg);
      assert(Element.toNodes in v.tc('red'));
      const div = el.Div(v.tc('red'));
      assert(div instanceof globalThis.Node);
    });

    it('operator cells are mountable', () => {
      const v = createVisuals(baseCfg);
      for (const cell of [
        v.Select('& > a', v.tc('red')),
        v.Query('@media (min-width: 40em)', v.tc('red')),
        v.Important(v.tc('red')),
        v.Inline(v.tc('red')),
        v.FromObject({ color: 'red' }),
        v.Transition('0.3s ease', v.tc('red')),
        v.Animation('1s linear', { 0: v.tc('red'), 100: v.tc('blue') }),
      ]) {
        assert(Element.toNodes in cell);
      }
    });
  });

  describe('mounting — inserts CSS rules into the stylesheet', () => {
    it('static chain: appending to a div inserts rules', () => {
      const v = createVisuals(baseCfg);
      el.Div(v.tc('red').p(1));
      const sheet = v._.styleSheet.style.sheet;
      assert(sheet.cssRules.length >= 2, 'at least 2 rules inserted');
    });

    it('Select: inserts one rule with combined selector', () => {
      const v = createVisuals(baseCfg);
      el.Div(v.Select('&:hover', v.tc('red')));
      const sheet = v._.styleSheet.style.sheet;
      let found = false;
      for (const r of sheet.cssRules) {
        if (r.cssText.includes(':hover') && r.cssText.includes('red')) found = true;
      }
      assert(found, 'expected a rule joining :hover and color:red');
    });

    it('FromObject(plain) inserts one rule', () => {
      const v = createVisuals(baseCfg);
      el.Div(v.FromObject({ pointerEvents: 'none' }));
      const sheet = v._.styleSheet.style.sheet;
      let found = false;
      for (const r of sheet.cssRules) {
        if (r.cssText.includes('pointer-events')) found = true;
      }
      assert(found, 'expected pointer-events rule');
    });

    it('Inline: writes properties to element.style instead of stylesheet', () => {
      const v = createVisuals(baseCfg);
      const div = el.Div(v.Inline(v.tc('red')));
      assertEquals(div.style.getPropertyValue('color'), 'red');
    });
  });

  describe('_.recalculate — identity-preserving rebuild', () => {
    it('keeps StyleRule identity, refreshes .css', () => {
      const v = createVisuals(baseCfg);
      const chain = v.tc('red');
      const { step, ctx } = collect(chain)[0];
      const ruleBefore = materialize(step, ctx);
      ruleBefore.rebuild();
      el.Div(chain);
      v._.recalculate();
      const ruleAfter = materialize(step, ctx);
      assert(ruleBefore === ruleAfter);
    });
  });

  describe('quiz-view real-world smoke', () => {
    it('btnBase factory chain builds', () => {
      const v = createVisuals(baseCfg);
      const btnBase = () => v
        .row`c c`.flex`1`.mnh`6`.ph`4`.tt`u`.ts`14px`.tw`600`.tl`1.2`
        .tws`nw`.sel`n`.ptr().r`1.5`.tf('main');
      const chain = btnBase();
      const steps = consToArray(chain.steps);
      assertEquals(steps.length, 13);
      el.Div(chain);
    });

    it('col + template + size chain mounts', () => {
      const v = createVisuals(baseCfg);
      el.Div(v.col`c t`.mnh`f`.w`f`.tc`t-main`);
    });

    it('grid + span + rel chain mounts', () => {
      const v = createVisuals(baseCfg);
      el.Div(v.grid(5, null).gap`2`.w`f`.h`6`);
    });

    it('reactive bg + static rel composes correctly', () => {
      const v = createVisuals(baseCfg);
      const chain = v.bg(() => '#fff').rel();
      const out = collect(chain);
      assertEquals(out.length, 2);
      assertEquals(out[0].reactive, true);
      assertEquals(out[1].reactive, false);
    });

    it('FromObject from Actions.js migrated pattern', () => {
      const v = createVisuals(baseCfg);
      el.Div(
        v.abs().il`0`,
        v.FromObject({ pointerEvents: 'none' }),
      );
    });

    it('Animation keyframes with chain cells (Root.js pattern)', () => {
      const v = createVisuals(baseCfg);
      const cell = v.Animation('420ms ease-out forwards', {
        0: [v.op`0`],
        100: [v.op`1`],
      });
      const out = collect(cell);
      assertEquals(out.length, 1);
    });

    it('Select with reactive field selector + nested chain + FromObject', () => {
      const v = createVisuals(baseCfg);
      const cell = v.Select(
        '& > input:focus',
        v.w`f`.ph`2.5`,
        v.FromObject({ background: '#fff' }),
      );
      const out = collect(cell);
      assert(out.length >= 3, 'at least w/ph + FromObject');
      for (const { ctx } of out) assertEquals(ctx.selector, '& > input:focus');
    });
  });
});
