import { describe, it } from 'jsr:@std/testing/bdd';
import assert from 'node:assert/strict';
import { r } from '../index.js';

const watchValues = read => {
  const values = [];
  r.effect(() => {
    values.push(read());
  });
  return values;
};

describe('dval', () => {
  it('skip_equal', () => {
    const value = r.dval(0);
    let runCount = 0;
    r.effect(() => {
      runCount++;
      value();
    });

    assert.equal(runCount, 1);

    value(0);
    value(0);
    assert.equal(runCount, 1, 'must not re-run when value is identical');

    value(1);
    assert.equal(runCount, 2, 'must re-run when value changes');
  });

  it('strict_identity', () => {
    const firstObject = { id: 1, label: 'a' };
    const secondObject = { id: 1, label: 'a' };
    const thirdObject = { id: 2, label: 'b' };
    const value = r.dval(firstObject);
    const seenObjects = watchValues(() => value());

    value(firstObject);
    value(secondObject);
    value(thirdObject);

    assert.equal(seenObjects.length, 3);
    assert.equal(seenObjects[0], firstObject);
    assert.equal(seenObjects[1], secondObject);
    assert.equal(seenObjects[2], thirdObject);
  });
});

describe('derived', () => {
  it('sync', () => {
    const left = r.val(2);
    const right = r.val(3);
    let computeCount = 0;

    const sum = r.derived(() => {
      computeCount++;
      return left() + right();
    });

    assert.equal(computeCount, 1);
    assert.equal(sum(), 5);

    left(10);

    assert.equal(computeCount, 2);
    assert.equal(sum(), 13);
  });

  it('promise', async () => {
    const source = r.val(1);
    const doubled = r.derived(() => Promise.resolve(source() * 2));

    assert.equal(doubled(), undefined);

    await Promise.resolve();
    assert.equal(doubled(), 2);

    source(5);

    await Promise.resolve();
    assert.equal(doubled(), 10);
  });

  it('async_fn', async () => {
    const source = r.val(1);
    const value = r.derived(async () => {
      const s = source();
      return s + await Promise.resolve(10);
    });

    assert.equal(value(), undefined);

    await Promise.resolve();
    await Promise.resolve();
    assert.equal(value(), 11);

    source(5);

    await Promise.resolve();
    await Promise.resolve();
    assert.equal(value(), 15);
  });

  it('no_await', async () => {
    const source = r.val(1);
    const value = r.derived(() => Promise.resolve(source() * 3), false);

    const firstPromise = value();
    assert.ok(firstPromise instanceof Promise);
    assert.equal(await firstPromise, 3);

    source(2);

    const secondPromise = value();
    assert.ok(secondPromise instanceof Promise);
    assert.notEqual(secondPromise, firstPromise);
    assert.equal(await secondPromise, 6);
  });
});

describe('store', () => {
  it('reactive_object', () => {
    const store = r.store({ count: 1 });
    const seenValues = watchValues(() => store.count);

    store.count = 2;

    assert.deepEqual(seenValues, [1, 2]);
    assert.equal(store.count, 2);
  });

  it('property_isolation', () => {
    const store = r.store({ first: 1, second: 2 });
    const seenFirstValues = watchValues(() => store.first);

    store.second = 3;
    store.first = 4;

    assert.deepEqual(seenFirstValues, [1, 4]);
  });

  it('functional_target', () => {
    const object = r.val({ name: 'a', age: 1 });
    const store = r.store(() => object());
    const seenNames = watchValues(() => store.name);

    store.name = 'b';
    assert.equal(object().name, 'b');

    object({ name: 'c', age: 9 });

    assert.deepEqual(seenNames, ['a', 'b', 'c']);
    assert.equal(store.name, 'c');
  });
});

describe('proxy', () => {
  it('plain_object', () => {
    const state = { x: 1, y: 2 };
    const proxy = r.proxy(state);
    const seenValues = watchValues(() => proxy.x());

    proxy.x(10);

    assert.deepEqual(seenValues, [1, 10]);
    assert.equal(state.x, 10);
  });

  it('property_isolation', () => {
    const state = { first: 1, second: 2 };
    const proxy = r.proxy(state);
    const seenFirstValues = watchValues(() => proxy.first());

    proxy.second(3);
    proxy.first(4);

    assert.deepEqual(seenFirstValues, [1, 4]);
  });

  it('functional_target', () => {
    const object = r.val({ name: 'a', age: 1 });
    const proxy = r.proxy(() => object());
    const seenNames = watchValues(() => proxy.name());

    proxy.name('b');
    assert.equal(object().name, 'b');

    object({ name: 'c', age: 9 });

    assert.deepEqual(seenNames, ['a', 'b', 'c']);
    assert.equal(proxy.name(), 'c');
  });
});
