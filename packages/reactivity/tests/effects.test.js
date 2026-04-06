import { describe, it } from 'jsr:@std/testing/bdd';
import assert from 'node:assert/strict';
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
  it('unsubscribe_when_branch_skips_read', () => {
    const enabled = r.val(true);
    const source = r.val(1);
    let runCount = 0;
    const seenValues = [];

    r.effect(() => {
      runCount++;
      if (!enabled()) return;
      seenValues.push(source());
    });

    assert.equal(runCount, 1);
    assert.deepEqual(seenValues, [1]);

    enabled(false);
    const runCountAfterDisable = runCount;
    source(2);

    assert.equal(
      runCount,
      runCountAfterDisable,
      'effect should unsubscribe from source when the disabled branch stops reading it',
    );
    assert.deepEqual(seenValues, [1]);

    enabled(true);

    assert.equal(runCount, runCountAfterDisable + 1);
    assert.deepEqual(seenValues, [1, 2]);
  });
});

describe('untrack', () => {
  it('no_subscribe', () => {
    const left = r.val(2);
    const right = r.val(3);
    let outerRunCount = 0;
    const seenProducts = [];

    r.effect(() => {
      outerRunCount++;
      const leftValue = left();
      r.untrack(() => {
        seenProducts.push(leftValue * right());
      });
    });

    left(4);
    right(5);

    assert.equal(outerRunCount, 2);
    assert.deepEqual(seenProducts, [6, 12]);
  });
});

describe('cleanup', () => {
  it('stops_reruns_on_destroy', () => {
    const value = r.val(0);
    const { log, effect } = watchCleanupLog(value);

    assert.deepEqual(log, ['run:0']);

    value(1);

    assert.deepEqual(log, ['run:0', 'clean:0', 'run:1']);

    effect.destroy();

    assert.deepEqual(log, ['run:0', 'clean:0', 'run:1', 'clean:1']);

    value(2);

    assert.deepEqual(log, ['run:0', 'clean:0', 'run:1', 'clean:1']);
  });
});
