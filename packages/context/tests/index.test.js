import { describe, it } from 'jsr:@std/testing/bdd';
import { assertEquals, assertThrows } from 'jsr:@std/assert';
import { Context } from '../sync.js';
import { AsyncContext } from '../async.js';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

describe('sync', () => {
  it('initial value', () => {
    const ctx = Context(1);
    assertEquals(ctx(), 1);
  });

  it('wrapped function return value', () => {
    const ctx = Context(0);
    assertEquals(ctx.run(1, () => 42), 42);
  });

  it('bound function return value', () => {
    const ctx = Context(0);
    const fn = ctx.bind(5, (x, y) => ctx() + x + y);
    assertEquals(fn(1, 2), 5 + 1 + 2);
    assertEquals(ctx(), 0);
  });

  it('bound value', () => {
    const ctx = Context(0);
    ctx.run(2, () => assertEquals(ctx(), 2));
    assertEquals(ctx(), 0);
  });

  it('error handling', () => {
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

  it('nested', () => {
    const ctx = Context('a');
    ctx.run('b', () => {
      assertEquals(ctx(), 'b');
      ctx.run('c', () => assertEquals(ctx(), 'c'));
      assertEquals(ctx(), 'b');
    });
    assertEquals(ctx(), 'a');
  });

  it('trailing arguments', () => {
    const ctx = Context(10);
    assertEquals(
      ctx.run(5, (a, b) => ctx() + a + b, 1, 2),
      5 + 1 + 2,
    );
  });

  it('post-await outer value', async () => {
    const ctx = Context(0);
    let valueRightAfterStart;
    const p = ctx.run(1, async () => {
      valueRightAfterStart = ctx();
      await delay(2);
      return ctx();
    });
    assertEquals(ctx(), 0);
    assertEquals(valueRightAfterStart, 1);
    assertEquals(await p, 0);
  });
});

describe('async', () => {
  it('initial value', () => {
    const ctx = AsyncContext('init');
    assertEquals(ctx(), 'init');
  });

  it('wrapped function return value', async () => {
    const ctx = AsyncContext(0);
    const v = await ctx.run(1, async () => {
      await delay(0);
      return 99;
    });
    assertEquals(v, 99);
  });

  it('bound function return value', async () => {
    const ctx = AsyncContext(0);
    const fn = ctx.bind(7, async () => {
      await delay(0);
      return ctx();
    });
    assertEquals(await fn(), 7);
    assertEquals(ctx(), 0);
  });

  it('bound value', () => {
    const ctx = AsyncContext(0);
    ctx.run(2, () => assertEquals(ctx(), 2));
    assertEquals(ctx(), 0);
  });

  it('value through await', async () => {
    const ctx = AsyncContext(0);
    await ctx.run(1, async () => {
      assertEquals(ctx(), 1);
      await delay(0);
      assertEquals(ctx(), 1);
    });
    assertEquals(ctx(), 0);
  });

  it('concurrent isolation', async () => {
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

  it('nested outer value', async () => {
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
