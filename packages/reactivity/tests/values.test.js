import { describe, it } from 'jsr:@std/testing/bdd';
import { assertEquals, assertThrows } from 'jsr:@std/assert';
import { r } from '../index.js';

const watchValues = read => {
  const values = [];
  r.effect(() => {
    values.push(read());
  });
  return values;
};

describe('val', () => {
  it('basic', () => {
    const value = r.val(1);

    assertEquals(value(), 1);
    assertEquals(value(2), 2);
    assertEquals(value(), 2);
  });

  it('rerun on equal writes', () => {
    const value = r.val(0);
    const seenValues = watchValues(() => value());

    value(0);
    value(0);

    assertEquals(seenValues, [0, 0, 0]);
  });
});

describe('dval', () => {
  it('basic', () => {
    const value = r.dval(1);
    let runs = 0;

    r.effect(() => {
      runs++;
      value();
    });

    value(1);
    value(2);

    assertEquals(runs, 2);
    assertEquals(value(), 2);
  });

  it('skip equal', () => {
    const value = r.dval(0);
    let runCount = 0;
    r.effect(() => {
      runCount++;
      value();
    });

    assertEquals(runCount, 1);

    value(0);
    value(0);
    assertEquals(runCount, 1, 'must not re-run when value is identical');

    value(1);
    assertEquals(runCount, 2, 'must re-run when value changes');
  });

  it('strict identity', () => {
    const firstObject = { id: 1, label: 'a' };
    const secondObject = { id: 1, label: 'a' };
    const thirdObject = { id: 2, label: 'b' };
    const value = r.dval(firstObject);
    const seenObjects = watchValues(() => value());

    value(firstObject);
    value(secondObject);
    value(thirdObject);

    assertEquals(seenObjects, [firstObject, secondObject, thirdObject]);
  });
});

describe('computed', () => {
  it('throw propagates', () => {
    assertThrows(() => {
      r.computed(() => { throw new Error('test'); });
    }, Error, 'test');

    const log = [];
    r.effect(() => {
      r.computed(() => { throw new Error('test'); });
    }, {
      onError: err => log.push(`error:${err.message}`),
    });
    assertEquals(log, ['error:test']);
  });

  it('rejects async function', () => {
    assertThrows(
      () => r.computed(async () => {}),
      Error,
      'synchronous function expected',
    );
  });

  it('rejects async generator function', () => {
    assertThrows(
      () => r.computed(async function* () {}),
      Error,
      'synchronous function expected',
    );
  });

  it('basic', () => {
    const left = r.val(2);
    const right = r.val(3);
    let computeCount = 0;

    const sum = r.computed(() => {
      computeCount++;
      return left() + right();
    });

    assertEquals(computeCount, 1);
    assertEquals(sum(), 5);

    left(10);

    assertEquals(computeCount, 2);
    assertEquals(sum(), 13);
  });

  it('cached reads', () => {
    const source = r.val(2);
    let computeCount = 0;
    const doubled = r.computed(() => {
      computeCount++;
      return source() * 2;
    });

    assertEquals(computeCount, 1);
    assertEquals(doubled(), 4);
    assertEquals(doubled(), 4);
    assertEquals(computeCount, 1);

    source(3);
    assertEquals(computeCount, 2);
    assertEquals(doubled(), 6);
    assertEquals(doubled(), 6);
    assertEquals(computeCount, 2);
  });

  it('dynamic dependency switching', () => {
    const a = r.val(1);
    const b = r.val(2);
    const toggle = r.val(true);
    let runs = 0;

    const picked = r.computed(() => {
      runs++;
      return toggle() ? a() : b();
    });

    assertEquals(picked(), 1);
    assertEquals(runs, 1);

    toggle(false);
    assertEquals(picked(), 2);
    assertEquals(runs, 2);

    a(10);
    assertEquals(runs, 2, 'must not recompute when inactive dep changes');
    assertEquals(picked(), 2);

    b(20);
    assertEquals(picked(), 20);
    assertEquals(runs, 3);
  });

  it('writes: computed cannot write other signals', () => {
    const source = r.val(1);
    const target = r.val(0);
    assertThrows(
      () => r.computed(() => target(source())),
      Error,
      'effect scope',
    );
  });

});

const describeStore = (name, create, read, write) => describe(name, () => {
  it('basic', () => {
    const state = { x: 1, y: 2 };
    const target = create(state);
    const seenValues = watchValues(() => read(target, 'x'));

    write(target, 'x', 10);

    assertEquals(seenValues, [1, 10]);
    assertEquals(state.x, 10);
  });

  it('property isolation', () => {
    const state = { first: 1, second: 2 };
    const target = create(state);
    const seenFirstValues = watchValues(() => read(target, 'first'));

    write(target, 'second', 3);
    write(target, 'first', 4);

    assertEquals(seenFirstValues, [1, 4]);
  });

  it('nested in-place mutation does not rerun top-level dependency', () => {
    const state = { user: { name: 'a', age: 1 } };
    const target = create(state);
    const seenNames = watchValues(() => read(target, 'user').name);

    state.user.name = 'b';

    assertEquals(seenNames, ['a']);
  });

  it('replace nested object reruns top-level dependency', () => {
    const state = { user: { name: 'a', age: 1 } };
    const target = create(state);
    const seenNames = watchValues(() => read(target, 'user').name);

    write(target, 'user', { ...state.user, name: 'c' });

    assertEquals(seenNames, ['a', 'c']);
  });

  it('functional target', () => {
    const object = r.val({ name: 'a', age: 1 });
    const target = create(() => object());
    const seenNames = watchValues(() => read(target, 'name'));

    write(target, 'name', 'b');
    assertEquals(object().name, 'b');

    object({ name: 'c', age: 9 });

    assertEquals(seenNames, ['a', 'b', 'c']);
    assertEquals(read(target, 'name'), 'c');
  });

  it('writes follow current target', () => {
    const first = { name: 'a' };
    const second = { name: 'b' };
    const current = r.val(first);
    const target = create(() => current());

    current(second);
    write(target, 'name', 'c');

    assertEquals(first.name, 'a');
    assertEquals(second.name, 'c');
    assertEquals(read(target, 'name'), 'c');
  });
});

describeStore('store',
  target => r.store(target),
  (target, key) => target[key],
  (target, key, value) => target[key] = value,
);

describeStore('proxy',
  target => r.proxy(target),
  (target, key) => target[key](),
  (target, key, value) => target[key](value),
);
