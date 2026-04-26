import { describe, it } from 'jsr:@std/testing/bdd';
import { assertEquals } from 'jsr:@std/assert';
import { r } from '../index.js';

describe('flow', () => {
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
    assertEquals(b(), 10);
    assertEquals(c(), 11);
  });

  it('diamond', () => {
    const a = r.val(0);
    const b = r.val(0);
    const c = r.val(0);
    const d = r.val(0);
    let bcRuns = 0;
    let dRuns = 0;

    r.effect(() => {
      b(a() * 2);
      c(a() * 3);
    });

    r.effect(() => {
      bcRuns++;
      d(b() + c());
    });

    r.effect(() => {
      dRuns++;
      d();
    });

    bcRuns = 0;
    dRuns = 0;
    a(2);
    assertEquals(bcRuns, 1, 'b+c observer must run once per a() update');
    assertEquals(dRuns, 1, 'd observer must run once per a() update');
    assertEquals(d(), 10);
  });

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
    assertEquals(
      violations,
      [],
      `invariant b === a + 1 at every observer run; ${JSON.stringify(violations)}`,
    );
  });

  it('multi write', () => {
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
    assertEquals(downstreamRuns, 1);
    assertEquals(sink(), 30);
  });

  it('dynamic deps', () => {
    const pick = r.val('x');
    const x = r.val(1);
    const y = r.val(100);
    const out = r.val(0);

    r.effect(() => {
      out(pick() === 'x' ? x() : y());
    });

    assertEquals(out(), 1);

    pick('y');
    y(42);
    assertEquals(out(), 42);
    x(999);
    assertEquals(out(), 42, 'on y branch, x must not drive out');

    pick('x');
    assertEquals(out(), 999);

    x(5);
    assertEquals(out(), 5);

    pick('y');
    y(10);
    assertEquals(out(), 10);
    x(888);
    assertEquals(out(), 10, 'back on y branch, x must not drive out');
  });

  it('cyclic', () => {
    const a = r.val(0);
    const b = r.val(0);
    r.effect(() => { b(a() + 1); });
    r.effect(() => { a(b()); });
    assertEquals({ a: a(), b: b() }, { a: 2, b: 2 });
  });
});
