import { describe, it } from 'jsr:@std/testing/bdd';
import { assertEquals, assertThrows } from 'jsr:@std/assert';
import { Signal, Effect, currentEffect } from '../base.js';
import { r } from '../index.js';

const valueSignal = (value = 0) => new Signal({
  get() { return value; },
  set(next) { value = next; this.trigger(); return value; },
});

describe('signal', () => {
  it('subscribe', () => {
    const signal = valueSignal(1);
    const effect = new Effect({
      handler: () => { signal.get(); },
      tracking: true,
    });

    effect.run();

    assertEquals(effect.signals?.has(signal), true);
    assertEquals(effect.signals?.size, 1);
    assertEquals(signal.effects?.has(effect), true);
    assertEquals(signal.effects?.size, 1);
  });

  it('skip untracked', () => {
    const signal = valueSignal(1);
    const effect = new Effect({
      handler: () => { signal.get(); },
      tracking: false,
    });

    effect.run();

    assertEquals(effect.signals, null);
    assertEquals(signal.effects?.size, 0);
  });

  it('trigger', () => {
    const signal = valueSignal(1);
    let runs = 0;
    const effect = new Effect({
      handler: () => {
        runs++;
        signal.get();
      },
      tracking: true,
    });

    effect.run();
    runs = 0;

    signal.trigger();

    assertEquals(runs, 1);
    assertEquals(signal.effects?.has(effect), true);
    assertEquals(signal.effects?.size, 1);
  });

  it('queue updates', () => {
    const signal = valueSignal(1);

    const log = [];
    const parent = new Effect({
      handler: () => {
        log.push('parent');
        signal.trigger();
        signal.trigger();
      },
      tracking: true,
    });

    let childRuns = 0;
    const child = new Effect({
      handler: () => {
        childRuns++;
        signal.get();
      },
      tracking: true,
    });

    child.run();
    childRuns = 0;
    parent.run();

    assertEquals(log, ['parent']);
    assertEquals(childRuns, 1);
    assertEquals(parent.queued, false);
    assertEquals(signal.effects?.has(child), true);
    assertEquals(signal.effects?.size, 1);
  });
});

describe('effect', () => {
  it('restore context', () => {
    const seen = [];
    let outer;
    const inner = new Effect({
      handler: () => {
        seen.push(currentEffect() === inner ? 'inner' : 'other');
      },
      tracking: false,
    });
    outer = new Effect({
      handler: () => {
        seen.push(currentEffect() === outer ? 'outer' : 'other');
        inner.run();
        seen.push(currentEffect() === outer ? 'outer' : 'other');
      },
      tracking: false,
    });

    outer.run();

    assertEquals(seen, ['outer', 'inner', 'outer']);
    assertEquals(currentEffect(), undefined);
  });

  it('cleanup signals', () => {
    const left = valueSignal(1);
    const right = valueSignal(2);
    const effect = new Effect({
      handler: () => {
        left.get();
        right.get();
      },
      tracking: true,
    });

    effect.run();
    effect.cleanup();

    assertEquals(effect.signals, null);
    assertEquals(left.effects?.size, 0);
    assertEquals(right.effects?.size, 0);
  });

  it('cleanup callbacks', () => {
    let cleaned = 0;
    const effect = new Effect({
      handler: () => {},
      tracking: false,
    });
    effect.cleanups = [
      () => cleaned++,
      () => cleaned++,
    ];

    effect.cleanup();

    assertEquals(cleaned, 2);
    assertEquals(effect.cleanups, null);
  });

  it('cleanup children', () => {
    let cleaned = 0;
    const parent = new Effect({
      handler: () => {},
      tracking: false,
    });
    parent.children = [
      { cleanup: () => cleaned++ },
      { cleanup: () => cleaned++ },
    ];

    parent.cleanup();

    assertEquals(cleaned, 2);
    assertEquals(parent.children, null);
  });

  it('destroy', () => {
    const signal = valueSignal(1);
    let cleaned = 0;
    const effect = new Effect({
      handler: () => {
        signal.get();
        (currentEffect().cleanups ??= []).push(() => cleaned++);
      },
      tracking: true,
    });

    effect.run();
    effect.destroy();

    assertEquals(effect.destroyed, true);
    assertEquals(effect.parent, null);
    assertEquals(effect.signals, null);
    assertEquals(effect.cleanups, null);
    assertEquals(cleaned, 1);
    assertEquals(signal.effects?.size, 0);
  });

  it('destroy children', () => {
    let destroyed = 0;
    const parent = new Effect({
      handler: () => {},
      tracking: false,
    });
    parent.children = [
      { destroy: () => destroyed++ },
      { destroy: () => destroyed++ },
    ];

    parent.destroy();

    assertEquals(parent.destroyed, true);
    assertEquals(parent.children, null);
    assertEquals(destroyed, 2);
  });

  it('clears queue', () => {
    const signal = valueSignal(1);
    let runs = 0;
    const child = new Effect({
      handler: () => {
        runs++;
        signal.get();
      },
      tracking: true,
    });
    child.run();
    runs = 0;
    const effect = new Effect({
      handler: () => {
        signal.trigger();
        signal.trigger();
      },
      tracking: true,
    });

    effect.run();

    assertEquals(runs, 1);
    assertEquals(effect.queued, false);
    assertEquals(child.queued, false);
  });
});

describe('leak', () => {
  it('branch subscriptions', () => {
    const branch = valueSignal('left');
    const left = valueSignal(1);
    const right = valueSignal(2);
    const effect = new Effect({
      handler: () => {
        branch.get() === 'left' ? left.get() : right.get();
      },
      tracking: true,
    });

    effect.run();
    assertEquals(branch.effects?.size, 1);
    assertEquals(left.effects?.size, 1);
    assertEquals(right.effects?.size, 0);

    for (const next of ['right', 'left', 'right', 'left']) {
      branch.set(next);
      assertEquals(branch.effects?.size, 1);
      assertEquals(left.effects?.size, next === 'left' ? 1 : 0);
      assertEquals(right.effects?.size, next === 'right' ? 1 : 0);
      assertEquals(effect.signals?.size, 2);
    }

    effect.destroy();
    assertEquals(branch.effects?.size, 0);
    assertEquals(left.effects?.size, 0);
    assertEquals(right.effects?.size, 0);
  });

  it('stable subscriptions', () => {
    const signal = valueSignal(1);
    const effect = new Effect({
      handler: () => { signal.get(); },
      tracking: true,
    });

    for (let i = 0; i < 50; i++) {
      effect.run();
      assertEquals(effect.signals?.size, 1);
      assertEquals(signal.effects?.size, 1);
    }

    effect.destroy();
    assertEquals(signal.effects?.size, 0);
  });

  it('stable children', () => {
    let parent;
    parent = new Effect({
      handler: () => {
        const child = new Effect({
          parent,
          handler: () => {},
          tracking: false,
        });
        child.run();
      },
      tracking: true,
    });

    for (let i = 0; i < 50; i++) {
      parent.run();
      assertEquals(parent.children?.length, 1);
    }
  });

  it('stable cleanup', () => {
    let cleaned = 0;
    const effect = new Effect({
      handler: () => {
        (currentEffect().cleanups ??= []).push(() => cleaned++);
      },
      tracking: true,
    });

    for (let i = 0; i < 50; i++) {
      effect.run();
      assertEquals(effect.cleanups?.length, 1);
    }

    assertEquals(cleaned, 49);
    effect.cleanup();
    assertEquals(cleaned, 50);
    assertEquals(effect.cleanups, null);
  });

  it('stable queue', () => {
    const signal = valueSignal(1);
    let childRuns = 0;
    const child = new Effect({
      handler: () => {
        childRuns++;
        signal.get();
      },
      tracking: true,
    });
    child.run();
    childRuns = 0;

    const parent = new Effect({
      handler: () => {
        signal.trigger();
        signal.trigger();
      },
      tracking: true,
    });

    for (let i = 0; i < 50; i++) {
      parent.run();
      assertEquals(childRuns, i + 1);
      assertEquals(parent.queued, false);
      assertEquals(signal.effects?.size, 1);
    }
  });

  it('nested branches', () => {
    const branch = valueSignal('left');
    const mode = valueSignal('up');
    const left = valueSignal(1);
    const right = valueSignal(2);
    const up = valueSignal(3);
    const down = valueSignal(4);
    let root;

    root = new Effect({
      handler: () => {
        const side = branch.get();
        const middle = new Effect({
          parent: root,
          handler: () => {
            const axis = mode.get();
            const leaf = new Effect({
              parent: middle,
              handler: () => {
                (side === 'left' ? left : right).get();
                (axis === 'up' ? up : down).get();
              },
              tracking: true,
            });
            leaf.run();
          },
          tracking: true,
        });
        middle.run();
      },
      tracking: true,
    });

    root.run();
    assertEquals(root.children?.length, 1);
    assertEquals(root.children?.[0].children?.length, 1);
    assertEquals(branch.effects?.size, 1);
    assertEquals(mode.effects?.size, 1);
    assertEquals(left.effects?.size, 1);
    assertEquals(right.effects?.size, 0);
    assertEquals(up.effects?.size, 1);
    assertEquals(down.effects?.size, 0);

    branch.set('right');
    assertEquals(root.children?.length, 1);
    assertEquals(root.children?.[0].children?.length, 1);
    assertEquals(branch.effects?.size, 1);
    assertEquals(mode.effects?.size, 1);
    assertEquals(left.effects?.size, 0);
    assertEquals(right.effects?.size, 1);
    assertEquals(up.effects?.size, 1);
    assertEquals(down.effects?.size, 0);

    mode.set('down');
    assertEquals(root.children?.length, 1);
    assertEquals(root.children?.[0].children?.length, 1);
    assertEquals(branch.effects?.size, 1);
    assertEquals(mode.effects?.size, 1);
    assertEquals(left.effects?.size, 0);
    assertEquals(right.effects?.size, 1);
    assertEquals(up.effects?.size, 0);
    assertEquals(down.effects?.size, 1);

    branch.set('left');
    assertEquals(root.children?.length, 1);
    assertEquals(root.children?.[0].children?.length, 1);
    assertEquals(branch.effects?.size, 1);
    assertEquals(mode.effects?.size, 1);
    assertEquals(left.effects?.size, 1);
    assertEquals(right.effects?.size, 0);
    assertEquals(up.effects?.size, 0);
    assertEquals(down.effects?.size, 1);
  });

  it('mapped effects', () => {
    const a = valueSignal('a');
    const b = valueSignal('b');
    const c = valueSignal('c');
    const d = valueSignal('d');
    const list = valueSignal([a, b, c]);
    const all = [a, b, c, d];
    let root;

    root = new Effect({
      handler: () => {
        for (const item of list.get()) {
          const child = new Effect({
            parent: root,
            handler: () => { item.get(); },
            tracking: true,
          });
          child.run();
        }
      },
      tracking: true,
    });

    root.run();
    assertEquals(root.children?.length, 3);
    assertEquals(list.effects?.size, 1);
    assertEquals(a.effects?.size, 1);
    assertEquals(b.effects?.size, 1);
    assertEquals(c.effects?.size, 1);
    assertEquals(d.effects?.size, 0);

    list.set([c, a]);
    assertEquals(root.children?.length, 2);
    assertEquals(list.effects?.size, 1);
    assertEquals(a.effects?.size, 1);
    assertEquals(b.effects?.size, 0);
    assertEquals(c.effects?.size, 1);
    assertEquals(d.effects?.size, 0);

    list.set([d]);
    assertEquals(root.children?.length, 1);
    assertEquals(list.effects?.size, 1);
    assertEquals(a.effects?.size, 0);
    assertEquals(b.effects?.size, 0);
    assertEquals(c.effects?.size, 0);
    assertEquals(d.effects?.size, 1);

    list.set([]);
    assertEquals(root.children, null);
    assertEquals(list.effects?.size, 1);
    for (const signal of all) {
      assertEquals(signal.effects?.size, 0);
    }
  });
});

describe('writes', () => {
  it('false blocks set', () => {
    const a = valueSignal(0);
    const eff = new Effect({
      handler: () => { a.set(1); },
      tracking: false,
      writes: false,
    });
    assertThrows(() => eff.run(), Error, 'effect scope');
  });

  it('true allows set', () => {
    const a = valueSignal(0);
    const eff = new Effect({
      handler: () => { a.set(1); },
      tracking: false,
      writes: true,
    });
    eff.run();
    assertEquals(a.get(), 1);
  });

  it('undefined allows set', () => {
    const a = valueSignal(0);
    const eff = new Effect({
      handler: () => { a.set(1); },
      tracking: false,
    });
    eff.run();
    assertEquals(a.get(), 1);
  });

  it('single signal ref allows only that signal', () => {
    const a = valueSignal(0);
    const b = valueSignal(0);
    const eff = new Effect({
      handler: () => { a.set(1); b.set(2); },
      tracking: false,
      writes: a,
    });
    assertThrows(() => eff.run(), Error, 'effect scope');
  });

  it('single signal ref allows that signal', () => {
    const a = valueSignal(0);
    const eff = new Effect({
      handler: () => { a.set(7); },
      tracking: false,
      writes: a,
    });
    eff.run();
    assertEquals(a.get(), 7);
  });

  it('Signal.update writes to signal', () => {
    const a = valueSignal(5);
    a.update(x => x + 1);
    assertEquals(a.get(), 6);
  });

  it('writes: accessor is not accepted (only Signal instance)', () => {
    const cell = r.val(0);
    const eff = new Effect({
      handler: () => { cell(3); },
      tracking: false,
      writes: cell,
    });
    assertThrows(() => eff.run(), Error, 'effect scope');
  });
});

describe('throws', () => {
  it('without onError', () => {
    const effect = new Effect({
      handler: () => { throw new Error('boom'); },
      tracking: false,
    });

    assertThrows(
      () => effect.run(),
      Error,
      'boom',
    );
  });
});
