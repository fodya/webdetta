import { describe, it } from 'jsr:@std/testing/bdd';
import { assertEquals } from 'jsr:@std/assert';
import { r } from '../index.js';

const watchCleanupLog = signal => {
  const log = [];
  let effect;
  r.effect(() => {
    effect = r.effect(() => {
      const current = signal();
      log.push(`run:${current}`);
      r.cleanup(() => log.push(`clean:${current}`));
    });
  });
  return { log, effect };
};

describe('effect', () => {
  it('basic', () => {
    const value = r.val(1);
    const seen = [];

    r.effect(() => {
      seen.push(value());
    });

    value(2);
    assertEquals(seen, [1, 2]);
  });

  it('unsubscribe_when_branch_skips_read', () => {
    const enabled = r.val(true);
    const source = r.val(1);
    let runCount = 0;
    const seenValues = [];
    const reset = () => {
      runCount = 0;
      seenValues.length = 0;
    };
    r.effect(() => {
      runCount++;
      if (!enabled()) return;
      seenValues.push(source());
    });

    assertEquals(runCount, 1);
    assertEquals(seenValues, [1]);
    reset();

    enabled(false);
    source(2);

    assertEquals(
      runCount,
      1,
      'effect should unsubscribe from source when the disabled branch stops reading it',
    );
    assertEquals(seenValues, []);
    reset();

    enabled(true);
    assertEquals(runCount, 1);
    assertEquals(seenValues, [2]);
  });

  it('destroy', () => {
    const source = r.val(0);
    let runCount = 0, cleanupCount = 0;
    const reset = () => {
      runCount = 0;
      cleanupCount = 0;
    };
    const effect = r.effect(() => {
      runCount++;
      source();
      r.cleanup(() => cleanupCount++);
    });

    assertEquals(runCount, 1);
    assertEquals(cleanupCount, 0);
    reset();

    source(1);
    assertEquals(runCount, 1);
    assertEquals(cleanupCount, 1);
    reset();

    effect.destroy();
    assertEquals(runCount, 0);
    assertEquals(cleanupCount, 1);
    reset();

    source(2);
    assertEquals(runCount, 0);
    assertEquals(cleanupCount, 0);
    reset();

    effect.destroy();
    assertEquals(cleanupCount, 0);
  });

  it('nested_rerun_cleans_old_children', () => {
    const branch = r.val('left');
    const left = r.val(1);
    const right = r.val(10);
    const seen = [];
    const cleanups = [];
    const reset = () => {
      seen.length = 0;
      cleanups.length = 0;
    };
    r.effect(() => {
      const active = branch();
      r.effect(() => {
        const current = active === 'left' ? left() : right();
        seen.push(`${active}:${current}`);
        r.cleanup(() => cleanups.push(`${active}:${current}`));
      });
    });

    assertEquals(seen, ['left:1']);
    assertEquals(cleanups, []);
    reset();

    left(2);
    assertEquals(seen, ['left:2']);
    assertEquals(cleanups, ['left:1']);
    reset();

    branch('right');
    assertEquals(seen, ['right:10']);
    assertEquals(cleanups, ['left:2']);
    reset();

    left(3);
    assertEquals(seen, []);
    assertEquals(cleanups, []);
    reset();

    right(11);
    assertEquals(seen, ['right:11']);
    assertEquals(cleanups, ['right:10']);
  });

  it('nested_conditional', () => {
    const branch = r.val('left');
    const left = r.val(1);
    const right = r.val(10);
    const log = [];
    const reset = () => log.length = 0;
    r.effect(() => {
      log.push(`outer:${branch()}`);
      if (branch() === 'left') {
        r.effect(() => {
          const value = left();
          log.push(`left:${value}`);
          r.cleanup(() => log.push(`clean:left:${value}`));
        });
      } else {
        r.effect(() => {
          const value = right();
          log.push(`right:${value}`);
          r.cleanup(() => log.push(`clean:right:${value}`));
        });
      }
    });

    assertEquals(log, ['outer:left', 'left:1']);
    reset();

    left(2);
    assertEquals(log, ['clean:left:1', 'left:2']);
    reset();

    branch('right');
    assertEquals(log, ['clean:left:2', 'outer:right', 'right:10']);
    reset();

    left(3);
    assertEquals(log, []);
    reset();

    right(11);
    assertEquals(log, ['clean:right:10', 'right:11']);
    reset();

    branch('left');
    assertEquals(log, ['clean:right:11', 'outer:left', 'left:3']);
    reset();

    right(12);
    assertEquals(log, []);
    reset();

    left(4);
    assertEquals(log, ['clean:left:3', 'left:4']);
  });

  it('destroy_cascades', () => {
    const outer = r.val(0);
    const inner = r.val(0);
    let childRuns = 0, childCleanups = 0;
    const reset = () => {
      childRuns = 0;
      childCleanups = 0;
    };
    const effect = r.effect(() => {
      outer();
      r.effect(() => {
        childRuns++;
        inner();
        r.cleanup(() => childCleanups++);
      });
    });

    assertEquals(childRuns, 1);
    assertEquals(childCleanups, 0);
    reset();

    inner(1);
    assertEquals(childRuns, 1);
    assertEquals(childCleanups, 1);
    reset();

    effect.destroy();
    assertEquals(childRuns, 0);
    assertEquals(childCleanups, 1);
    reset();

    inner(2);
    assertEquals(childRuns, 0);
    assertEquals(childCleanups, 0);
    reset();

    outer(1);
    assertEquals(childRuns, 0);
    assertEquals(childCleanups, 0);
  });

  it('deep_nesting', () => {
    const a = r.val(0);
    const b = r.val(0);
    const c = r.val(0);
    const seen = [], cleanups = { outer: 0, middle: 0, inner: 0 };
    const reset = () => seen.length = cleanups.outer = cleanups.middle = cleanups.inner = 0;
    r.effect(() => {
      const av = a();
      r.cleanup(() => cleanups.outer++);
      r.effect(() => {
        const bv = b();
        r.cleanup(() => cleanups.middle++);
        r.effect(() => {
          const cv = c();
          seen.push([av, bv, cv]);
          r.cleanup(() => cleanups.inner++);
        });
      });
    });

    assertEquals(seen, [[0, 0, 0]]);
    assertEquals(cleanups, { outer: 0, middle: 0, inner: 0 });
    reset();

    c(1);
    assertEquals(seen, [[0, 0, 1]]);
    assertEquals(cleanups, { outer: 0, middle: 0, inner: 1 });
    reset();

    a(1);
    assertEquals(seen, [[1, 0, 1]]);
    assertEquals(cleanups, { outer: 1, middle: 1, inner: 1 });
    reset();

    c(2);
    assertEquals(seen, [[1, 0, 2]]);
    assertEquals(cleanups, { outer: 0, middle: 0, inner: 1 });
    reset();

    b(1);
    assertEquals(seen, [[1, 1, 2]]);
    assertEquals(cleanups, { outer: 0, middle: 1, inner: 1 });
    reset();

    c(3);
    assertEquals(seen, [[1, 1, 3]]);
    assertEquals(cleanups, { outer: 0, middle: 0, inner: 1 });
  });
});

describe('untrack', () => {
  it('returns_effect', () => {
    const effect = r.untrack(() => 1);

    assertEquals(typeof effect.destroy, 'function');
  });

  it('no_subscribe', () => {
    const left = r.val(2);
    const right = r.val(3);
    let outerRunCount = 0;
    const seenProducts = [];
    const reset = () => {
      outerRunCount = 0;
      seenProducts.length = 0;
    };
    r.effect(() => {
      outerRunCount++;
      const leftValue = left();
      r.untrack(() => {
        seenProducts.push(leftValue * right());
      });
    });

    assertEquals(outerRunCount, 1);
    assertEquals(seenProducts, [6]);
    reset();

    left(4);
    assertEquals(outerRunCount, 1);
    assertEquals(seenProducts, [12]);
    reset();

    right(5);
    assertEquals(outerRunCount, 0);
    assertEquals(seenProducts, []);
  });

  it('nested_conditional_cleanup', () => {
    const branch = r.val('left');
    const left = r.val(1);
    const right = r.val(10);
    const log = [];
    const reset = () => {
      log.length = 0;
    };
    r.effect(() => {
      const active = branch();
      r.untrack(() => {
        const value = active === 'left' ? left() : right();
        log.push(`${active}:${value}`);
        r.cleanup(() => log.push(`clean:${active}:${value}`));
      });
    });

    assertEquals(log, ['left:1']);
    reset();

    left(2);
    assertEquals(log, []);
    reset();

    right(11);
    assertEquals(log, []);
    reset();

    branch('right');
    assertEquals(log, ['clean:left:1', 'right:11']);
    reset();

    left(3);
    assertEquals(log, []);
    reset();

    right(12);
    assertEquals(log, []);
    reset();

    branch('left');
    assertEquals(log, ['clean:right:11', 'left:3']);
  });
});

describe('cleanup', () => {
  it('basic', () => {
    const value = r.val(1);
    const log = [];

    r.effect(() => {
      const current = value();
      log.push(`run:${current}`);
      r.cleanup(() => log.push(`clean:${current}`));
    });

    value(2);
    assertEquals(log, ['run:1', 'clean:1', 'run:2']);
  });

  it('stops_reruns_on_destroy', () => {
    const value = r.val(0);
    const { log, effect } = watchCleanupLog(value);

    assertEquals(log, ['run:0']);
    log.length = 0;

    value(1);
    assertEquals(log, ['clean:0', 'run:1']);
    log.length = 0;

    effect.destroy();
    assertEquals(log, ['clean:1']);
    log.length = 0;

    value(2);
    assertEquals(log, []);
  });
});
