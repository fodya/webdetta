import { describe, it } from 'jsr:@std/testing/bdd';
import { assert, assertEquals, assertThrows } from 'jsr:@std/assert';
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
  it('sync throw in body propagates', () => {
    assertThrows(
      () => {
        r.computed(() => {
          throw new Error('bad-computed');
        });
      },
      Error,
      'bad-computed',
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

  it('async basic', async () => {
    const source = r.val(2);
    const doubled = r.computed(() => Promise.resolve(source() * 2));

    assertEquals(doubled(), undefined);
    await Promise.resolve();
    assertEquals(doubled(), 4);
  });

  it('promise', async () => {
    const source = r.val(1);
    const doubled = r.computed(() => Promise.resolve(source() * 2));

    assertEquals(doubled(), undefined);

    await Promise.resolve();
    assertEquals(doubled(), 2);

    source(5);

    await Promise.resolve();
    assertEquals(doubled(), 10);
  });

  it('async', async () => {
    const source = r.val(1);
    const value = r.computed(async () => {
      const s = source();
      return s + await Promise.resolve(10);
    });

    assertEquals(value(), undefined);

    await Promise.resolve();
    await Promise.resolve();
    assertEquals(value(), 11);

    source(5);

    await Promise.resolve();
    await Promise.resolve();
    assertEquals(value(), 15);
  });

  it('async race', async () => {
    const promises = Array.from({ length: 5 }, () => Promise.withResolvers());
    const source = r.val();
    const value = r.computed(() => promises[source()]?.promise);

    assertEquals(value(), undefined);

    setTimeout(() => promises[3].resolve(3), 10);
    source(3);

    setTimeout(() => promises[0].resolve(0), 20);
    source(0);

    setTimeout(() => promises[1].resolve(1), 30);
    source(1);

    setTimeout(() => promises[4].resolve(4), 40);
    source(4);

    setTimeout(() => promises[2].resolve(2), 0);
    source(2);

    await new Promise(r => setTimeout(r, 50));

    assertEquals(value(), 2, 'older async results must not overwrite the latest one');
  });

  it('async race reject', async () => {
    const source = r.val('first');
    const first = Promise.withResolvers();
    const second = Promise.withResolvers();
    const value = r.computed(() => source() === 'first' ? first.promise : second.promise);

    source('second');
    second.resolve(2);
    await Promise.resolve();

    assertEquals(value(), 2);

    first.reject(new Error('stale'));
    await Promise.resolve();

    assertEquals(value(), 2, 'stale async reject must not affect newer result');
  });

  it('disabled promise resolution', async () => {
    const source = r.val(1);
    const value = r.computed(() => Promise.resolve(source() * 3), { resolvePromises: false });

    const firstPromise = value();
    assert(firstPromise instanceof Promise);
    assertEquals(await firstPromise, 3);

    source(2);

    const secondPromise = value();
    assert(secondPromise instanceof Promise);
    assert(secondPromise !== firstPromise);
    assertEquals(await secondPromise, 6);
  });

  it('custom type', () => {
    const source = r.val(1);
    const value = r.computed(() => source() % 2, {
      type: r.dval
    });
    const seenValues = [];

    r.effect(() => {
      seenValues.push(value());
    });

    assertEquals(value(), 1);
    assertEquals(seenValues, [1]);

    source(3);
    assertEquals(value(), 1);
    assertEquals(seenValues, [1]);

    source(2);
    assertEquals(value(), 0);
    assertEquals(seenValues, [1, 0]);
  });

  it('initial value', async () => {
    const source = r.val(1);
    const value = r.computed(
      () => Promise.resolve(source() * 2),
      { type: r.val, initial: 'loading' },
    );

    assertEquals(value(), 'loading');

    await Promise.resolve();
    assertEquals(value(), 2);
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

describeStore(
  'store',
  target => r.store(target),
  (target, key) => target[key],
  (target, key, value) => {
    target[key] = value;
  },
);

describeStore(
  'proxy',
  target => r.proxy(target),
  (target, key) => target[key](),
  (target, key, value) => target[key](value),
);
