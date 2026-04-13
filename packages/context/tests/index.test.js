import { describe, it } from 'jsr:@std/testing/bdd';
import { assertEquals, assertThrows } from 'jsr:@std/assert';
import { Context } from '../sync.js';
import { AsyncContext } from '../async.js';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

describe('sync', () => {
  it('initial state', () => {
    const ctx = Context(1);
    assertEquals(ctx(), 1);
  });

  it('run return', () => {
    const ctx = Context(0);
    assertEquals(ctx.run(1, () => 42), 42);
  });

  it('bind return', () => {
    const ctx = Context(0);
    const fn = ctx.bind(5, (x, y) => ctx() + x + y);
    assertEquals(fn(1, 2), 5 + 1 + 2);
    assertEquals(ctx(), 0);
  });

  it('escape outer read', () => {
    const ctx = Context(0);
    let fn;
    ctx.run(1, () => {
      fn = () => ctx();
      assertEquals(ctx(), 1);
    });
    assertEquals(fn(), 0);
    assertEquals(ctx(), 0);
  });

  it('bind isolation', () => {
    const ctx = Context(0);
    const fn = ctx.bind(5, () => ctx());
    ctx.run(10, () => {
      assertEquals(ctx(), 10);
      assertEquals(fn(), 5);
      assertEquals(ctx(), 10);
    });
    assertEquals(ctx(), 0);
  });

  it('bind nested override', () => {
    const ctx = Context(0);
    const fn = ctx.bind(1, () => ctx.run(2, () => ctx()));
    assertEquals(fn(), 2);
    assertEquals(ctx(), 0);
  });

  it('run value', () => {
    const ctx = Context(0);
    ctx.run(2, () => assertEquals(ctx(), 2));
    assertEquals(ctx(), 0);
  });

  it('throw restore', () => {
    const ctx = Context(0);
    assertThrows(
      () => ctx.run(9, () => {
        assertEquals(ctx(), 9);
        throw new Error('x');
      }),
      Error,
      'x',
    );
    assertEquals(ctx(), 0);
  });

  it('nested restore', () => {
    const ctx = Context('a');
    ctx.run('b', () => {
      assertEquals(ctx(), 'b');
      ctx.run('c', () => assertEquals(ctx(), 'c'));
      assertEquals(ctx(), 'b');
    });
    assertEquals(ctx(), 'a');
  });

  it('nested return', () => {
    const ctx = Context('a');
    const result = ctx.run('b', () => ctx.run('c', () => ctx()));
    assertEquals(result, 'c');
    assertEquals(ctx(), 'a');
  });

  it('cross-context isolation', () => {
    const a = Context(1);
    const b = Context(2);
    a.run(10, () => {
      b.run(20, () => {
        assertEquals(a(), 10);
        assertEquals(b(), 20);
      });
      assertEquals(a(), 10);
      assertEquals(b(), 2);
    });
    assertEquals(a(), 1);
    assertEquals(b(), 2);
  });

  it('identity stability', () => {
    const value = { n: 1 };
    const ctx = Context(value);
    assertEquals(ctx(), value);
    assertEquals(ctx(), value);
  });

  it('run arguments', () => {
    const ctx = Context(10);
    assertEquals(
      ctx.run(5, (a, b) => ctx() + a + b, 1, 2),
      5 + 1 + 2,
    );
  });

  it('sync async callback restore', async () => {
    const ctx = Context(0);
    let valueRightAfterStart;
    const p = ctx.run(1, async () => {
      valueRightAfterStart = ctx();
      await delay(2);
      return 123;
    });
    assertEquals(ctx(), 0);
    assertEquals(valueRightAfterStart, 1);
    assertEquals(await p, 123);
    assertEquals(ctx(), 0);
  });
});

describe('async', () => {
  it('initial state', () => {
    const ctx = AsyncContext('init');
    assertEquals(ctx(), 'init');
  });

  it('run return', async () => {
    const ctx = AsyncContext(0);
    const v = await ctx.run(1, async () => {
      await delay(0);
      return 99;
    });
    assertEquals(v, 99);
  });

  it('bind return', async () => {
    const ctx = AsyncContext(0);
    const fn = ctx.bind(7, async () => {
      await delay(0);
      return ctx();
    });
    assertEquals(await fn(), 7);
    assertEquals(ctx(), 0);
  });

  it('async escape outer read', async () => {
    const ctx = AsyncContext(0);
    let fn;
    await ctx.run(1, async () => {
      fn = async () => ctx();
      await delay(0);
      assertEquals(ctx(), 1);
    });
    assertEquals(await fn(), 0);
    assertEquals(ctx(), 0);
  });

  it('run value', () => {
    const ctx = AsyncContext(0);
    ctx.run(2, () => assertEquals(ctx(), 2));
    assertEquals(ctx(), 0);
  });

  it('await propagation', async () => {
    const ctx = AsyncContext(0);
    await ctx.run(1, async () => {
      assertEquals(ctx(), 1);
      await delay(0);
      assertEquals(ctx(), 1);
    });
    assertEquals(ctx(), 0);
  });

  it('concurrency isolation', async () => {
    const ctx = AsyncContext(0);
    const seen = [];
    await Promise.all([
      ctx.run(1, async () => {
        await delay(6);
        seen.push(['a', ctx()]);
      }),
      ctx.run(2, async () => {
        await delay(3);
        seen.push(['b', ctx()]);
      }),
    ]);
    assertEquals(seen.find((x) => x[0] === 'a'), ['a', 1]);
    assertEquals(seen.find((x) => x[0] === 'b'), ['b', 2]);
  });

  it('nested restore', async () => {
    const ctx = AsyncContext('o');
    await ctx.run('a', async () => {
      assertEquals(ctx(), 'a');
      await ctx.run('b', async () => {
        assertEquals(ctx(), 'b');
      });
      assertEquals(ctx(), 'a');
    });
    assertEquals(ctx(), 'o');
  });
});
