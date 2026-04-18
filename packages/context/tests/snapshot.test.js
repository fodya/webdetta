import { describe, it } from 'jsr:@std/testing/bdd';
import { assertEquals, assertRejects, assertThrows } from 'jsr:@std/assert';
import { Context } from '../sync.js';
import { AsyncContext } from '../async.js';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const sharedTests = (Ctx) => {
  it('captures the current value and replays it later', () => {
    const ctx = Ctx('root');
    let snap;
    ctx.run('A', () => {
      snap = Ctx.Snapshot();
      assertEquals(ctx(), 'A');
    });
    ctx.run('B', () => {
      assertEquals(ctx(), 'B');
      const result = snap(() => ctx());
      assertEquals(result, 'A');
      assertEquals(ctx(), 'B');
    });
    assertEquals(ctx(), 'root');
  });

  it('restores the snapshot value after an inner run finishes', () => {
    const ctx = Ctx('root');
    let snap;
    ctx.run('A', () => {
      snap = Ctx.Snapshot();
    });
    ctx.run('B', () => {
      snap(() => {
        assertEquals(ctx(), 'A');
        ctx.run('inner', () => {
          assertEquals(ctx(), 'inner');
        });
        assertEquals(ctx(), 'A');
      });
      assertEquals(ctx(), 'B');
    });
    assertEquals(ctx(), 'root');
  });

  it('restores the outer value after the snapshot callback throws', () => {
    const ctx = Ctx('root');
    let snap;
    ctx.run('A', () => {
      snap = Ctx.Snapshot();
    });
    assertThrows(() =>
      snap(() => {
        throw new Error('x');
      }),
      Error,
      'x',
    );
    ctx.run('B', () => {
      assertEquals(ctx(), 'B');
    });
    assertEquals(ctx(), 'root');
  });

  it('does not leak the snapshot value outside the snapshot call', () => {
    const ctx = Ctx('root');
    let snap;
    ctx.run('A', () => {
      snap = Ctx.Snapshot();
    });
    snap(() => {
      assertEquals(ctx(), 'A');
    });
    assertEquals(ctx(), 'root');
  });

  it('can be replayed multiple times from different outer scopes', () => {
    const ctx = Ctx('root');
    let snap;
    ctx.run('A', () => {
      snap = Ctx.Snapshot();
    });
    ctx.run('B', () => {
      assertEquals(snap(() => ctx()), 'A');
      assertEquals(ctx(), 'B');
    });
    ctx.run('C', () => {
      assertEquals(snap(() => ctx()), 'A');
      assertEquals(ctx(), 'C');
    });
    assertEquals(ctx(), 'root');
  });
}

describe('sync', () => {
  sharedTests(Context);
});

describe('async', () => {
  sharedTests(AsyncContext);

  it('preserves the captured value across awaits', async () => {
    const ctx = AsyncContext('root');
    let snap;
    await ctx.run('A', async () => {
      snap = AsyncContext.Snapshot();
      await delay(0);
      assertEquals(ctx(), 'A');
    });
    await ctx.run('B', async () => {
      const result = await snap(async () => {
        await delay(0);
        return ctx();
      });
      assertEquals(result, 'A');
      assertEquals(ctx(), 'B');
    });
    assertEquals(ctx(), 'root');
  });

  it('restores the outer value after an async snapshot callback rejects', async () => {
    const ctx = AsyncContext('root');
    let snap;
    await ctx.run('A', async () => {
      snap = AsyncContext.Snapshot();
    });
    await assertRejects(
      () =>
        ctx.run('B', () =>
          snap(async () => {
            assertEquals(ctx(), 'A');
            await delay(0);
            throw new Error('x');
          })),
      Error,
      'x',
    );
    await ctx.run('B', async () => {
      assertEquals(ctx(), 'B');
    });
    assertEquals(ctx(), 'root');
  });

  it('keeps concurrent snapshot replays isolated from each other', async () => {
    const ctx = AsyncContext('root');
    let snapA;
    let snapB;
    await Promise.all([
      ctx.run('A', async () => {
        snapA = AsyncContext.Snapshot();
        await delay(1);
      }),
      ctx.run('B', async () => {
        snapB = AsyncContext.Snapshot();
        await delay(1);
      }),
    ]);
    const [a, b] = await Promise.all([
      snapA(async () => {
        await delay(5);
        return ctx();
      }),
      snapB(async () => {
        await delay(2);
        return ctx();
      }),
    ]);
    assertEquals(a, 'A');
    assertEquals(b, 'B');
    assertEquals(ctx(), 'root');
  });

  it('captures a nested snapshot inside a replayed outer snapshot', async () => {
    const ctx = AsyncContext('root');
    let outer;
    await ctx.run('A', async () => {
      outer = AsyncContext.Snapshot();
    });
    await ctx.run('B', async () => {
      const result = await outer(async () => {
        const inner = AsyncContext.Snapshot();
        await delay(0);
        return inner(() => ctx());
      });
      assertEquals(result, 'A');
      assertEquals(ctx(), 'B');
    });
    assertEquals(ctx(), 'root');
  });
});
