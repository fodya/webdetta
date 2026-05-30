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
      const result = snap.run(() => ctx());
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
      snap.run(() => {
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
      snap.run(() => {
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
    snap.run(() => {
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
      assertEquals(snap.run(() => ctx()), 'A');
      assertEquals(ctx(), 'B');
    });
    ctx.run('C', () => {
      assertEquals(snap.run(() => ctx()), 'A');
      assertEquals(ctx(), 'C');
    });
    assertEquals(ctx(), 'root');
  });

  it('set returns a new snapshot and does not mutate the parent', () => {
    const a = Ctx('a0');
    const b = Ctx('b0');
    let snap;
    a.run('A', () => b.run('B', () => {
      snap = Ctx.Snapshot();
    }));
    a.run('A2', () => b.run('B2', () => {
      const branched = snap.set(a).set(b);
      assertEquals(snap.run(() => [a(), b()]), ['A', 'B']);
      assertEquals(branched.run(() => [a(), b()]), ['A2', 'B2']);
    }));
    assertEquals(snap.run(() => [a(), b()]), ['A', 'B']);
  });
};

describe('sync', () => {
  sharedTests(Context);

  it('set accepts explicit data', () => {
    const a = Context('a0');
    let snap;
    a.run('A', () => {
      snap = Context.Snapshot();
    });
    a.run('B', () => {
      const branched = snap.set(a, 'pinned');
      assertEquals(snap.run(() => a()), 'A');
      assertEquals(branched.run(() => a()), 'pinned');
      assertEquals(a(), 'B');
    });
  });

  it('set chain keeps last value for same context', () => {
    const a = Context('a0');
    const b = Context('b0');
    let snap;
    a.run('A', () => b.run('B', () => {
      snap = Context.Snapshot();
    }));

    const chained = snap.set(a, 1).set(b, 2).set(a, 3);
    assertEquals(chained.run(() => [a(), b()]), [3, 2]);
    assertEquals(snap.run(() => [a(), b()]), ['A', 'B']);
  });
});

describe('async', () => {
  sharedTests(AsyncContext);

  it('set accepts explicit data', async () => {
    const a = AsyncContext('a0');
    let snap;
    await a.run('A', async () => {
      snap = AsyncContext.Snapshot();
    });
    await a.run('B', async () => {
      const branched = snap.set(a, 'pinned');
      assertEquals(await snap.run(async () => a()), 'A');
      assertEquals(await branched.run(async () => a()), 'pinned');
      assertEquals(a(), 'B');
    });
  });

  it('preserves the captured value across awaits', async () => {
    const ctx = AsyncContext('root');
    let snap;
    await ctx.run('A', async () => {
      snap = AsyncContext.Snapshot();
      await delay(0);
      assertEquals(ctx(), 'A');
    });
    await ctx.run('B', async () => {
      const result = await snap.run(async () => {
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
          snap.run(async () => {
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
      snapA.run(async () => {
        await delay(5);
        return ctx();
      }),
      snapB.run(async () => {
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
      const result = await outer.run(async () => {
        const inner = AsyncContext.Snapshot();
        await delay(0);
        return inner.run(() => ctx());
      });
      assertEquals(result, 'A');
      assertEquals(ctx(), 'B');
    });
    assertEquals(ctx(), 'root');
  });

  it('set chains without mutating parent async snapshot', async () => {
    const a = AsyncContext('a0');
    const b = AsyncContext('b0');
    let snap;
    await a.run('A', async () => b.run('B', async () => {
      snap = AsyncContext.Snapshot();
    }));
    await a.run('A2', async () => b.run('B2', async () => {
      const branched = snap.set(a).set(b);
      assertEquals(await snap.run(async () => [a(), b()]), ['A', 'B']);
      assertEquals(await branched.run(async () => [a(), b()]), ['A2', 'B2']);
    }));
    assertEquals(await snap.run(async () => [a(), b()]), ['A', 'B']);
  });

  it('set chain keeps last value for same async context', async () => {
    const a = AsyncContext('a0');
    const b = AsyncContext('b0');
    let snap;
    await a.run('A', async () => b.run('B', async () => {
      snap = AsyncContext.Snapshot();
    }));

    const chained = snap.set(a, 1).set(b, 2).set(a, 3);
    assertEquals(await chained.run(async () => [a(), b()]), [3, 2]);
    assertEquals(await snap.run(async () => [a(), b()]), ['A', 'B']);
  });
});
