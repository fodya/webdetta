import { describe, it } from 'jsr:@std/testing/bdd';
import assert from 'node:assert/strict';
import { r } from '../index.js';

describe('flow', () => {
  /** Updates flow through a simple chain: a → b → c. */
  it('linear', () => {
    const a = r.val(0);
    const b = r.val(0);
    const c = r.val(0);
    r.effect(() => {
      b(a() * 2);
    });
    r.effect(() => {
      c(b() + 1);
    });
    a(5);
    assert.equal(b(), 10);
    assert.equal(c(), 11);
  });

  /** One source fans out to two signals; an effect that reads both runs once per source update (no double-run). */
  it('diamond', () => {
    const a = r.val(0);
    const b = r.val(0);
    const c = r.val(0);
    const d = r.val(0);
    let bcRuns = 0;

    r.effect(() => {
      b(a() * 2);
      c(a() * 3);
    });

    r.effect(() => {
      bcRuns++;
      d(b() + c());
    });

    bcRuns = 0;
    a(2);
    assert.equal(
      bcRuns,
      1,
      'b+c observer must run once per a() update (two runs would mean the same logical tick flushed it twice)',
    );
    assert.equal(d(), 10);
  });

  /**
   * Glitch: an effect reads A and B where B should always be f(A). Stale B means we saw an
   * inconsistent pair. Here B = A + 1; we record any run where B !== A + 1 (stricter than B > A).
   */
  it('glitch', () => {
    const a = r.val(0);
    const b = r.val(0);
    const violations = [];

    r.effect(() => {
      b(a() + 1);
    });

    r.effect(() => {
      const av = a();
      const bv = b();
      if (bv !== av + 1) {
        violations.push({ a: av, b: bv, expectedB: av + 1 });
      }
    });

    for (const next of [0, 1, 2, 10, -3]) {
      a(next);
    }
    assert.deepEqual(
      violations,
      [],
      `invariant b === a + 1 at every observer run; ${JSON.stringify(violations)}`,
    );
  });

  /** Several writes to the same signal inside one upstream effect should notify dependents once. */
  it('multi_write', () => {
    const src = r.val(0);
    const sink = r.val(0);
    let downstreamRuns = 0;

    r.effect(() => {
      src();
      sink(10);
      sink(20);
      sink(30);
    });

    r.effect(() => {
      sink();
      downstreamRuns++;
    });

    downstreamRuns = 0;
    src(1);
    assert.equal(downstreamRuns, 1);
    assert.equal(sink(), 30);
  });

  /**
   * Branching read: only the selected source is tracked. Toggling x → y → x → y checks
   * subscriptions follow the active branch.
   */
  it('dynamic_deps', () => {
    const pick = r.val('x');
    const x = r.val(1);
    const y = r.val(100);
    const out = r.val(0);

    r.effect(() => {
      out(pick() === 'x' ? x() : y());
    });

    assert.equal(out(), 1);

    pick('y');
    y(42);
    assert.equal(out(), 42);
    x(999);
    assert.equal(out(), 42, 'on y branch, x must not drive out');

    pick('x');
    assert.equal(out(), 999);

    x(5);
    assert.equal(out(), 5);

    pick('y');
    y(10);
    assert.equal(out(), 10);
    x(888);
    assert.equal(out(), 10, 'back on y branch, x must not drive out');
  });

  /**
   * Two effects read/write each other synchronously (no delay). That cannot settle;
   * expect a stack overflow rather than a quiet infinite loop.
   */
  it('cyclic', () => {
    let err;
    try {
      const a = r.val(0);
      const b = r.val(0);
      r.effect(() => b(a() + 1));
      r.effect(() => a(b()));
    } catch (e) {
      err = e;
    }
    assert.ok(err, 'expected setup to throw');
    assert.equal(err.name, 'RangeError');
    assert.match(String(err.message), /Maximum call stack|too much recursion/i);
  });
});
