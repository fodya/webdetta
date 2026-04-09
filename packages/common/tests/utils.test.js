import { describe, it } from 'jsr:@std/testing/bdd';
import { assertEquals, assertThrows } from 'jsr:@std/assert';
import {
  arr,
  err,
  isObject,
  isPlainObject,
  isAsync,
  isGenerator,
  isAsyncGenerator,
  isIterable,
  isAsyncIterable,
  isPromise,
  isTemplateCall,
  callFn,
  unwrapFn,
  toFn,
  templateCallToArray,
  objectEntriesDeep,
  objectMap,
  objectMapper,
  objectMapDeep,
  objectMapperDeep,
  objectPick,
  objectPicker,
} from '../utils.js';

describe('arr', () => {
  it('tokenization', () => {
    assertEquals(arr` alpha   beta
      gamma `, ['alpha', 'beta', 'gamma']);
  });

  it('empty template yields empty array', () => {
    assertEquals(arr``, []);
  });
});

describe('err', () => {
  it('template message', () => {
    try {
      const id = 7;
      err`failure ${id}`;
    } catch (e) {
      assertEquals(e.message, 'failure 7');
    }
  });

  it('throws on non-template arguments', () => {
    assertThrows(() => err('plain'), Error, 'plain');
  });
});

describe('isObject', () => {
  it('object literal', () => {
    assertEquals(isObject({}), true);
  });

  it('array', () => {
    assertEquals(isObject([]), true);
  });

  it('null', () => {
    assertEquals(isObject(null), false);
  });

  it('number primitive', () => {
    assertEquals(isObject(0), false);
  });
});

describe('isPlainObject', () => {
  it('object literal', () => {
    assertEquals(isPlainObject({ a: 1 }), true);
  });

  it('nullish values', () => {
    assertEquals(isPlainObject(null), false);
    assertEquals(isPlainObject(undefined), false);
  });

  it('array', () => {
    assertEquals(isPlainObject([]), false);
  });

  it('date and regexp', () => {
    assertEquals(isPlainObject(new Date()), false);
    assertEquals(isPlainObject(/x/), false);
  });
});

describe('isAsync', () => {
  it('async function', () => {
    assertEquals(isAsync(async () => 1), true);
  });

  it('sync function', () => {
    assertEquals(isAsync(() => 1), false);
  });

  it('generator function', () => {
    assertEquals(isAsync(function* () {}), false);
  });
});

describe('isGenerator', () => {
  it('generator function', () => {
    assertEquals(isGenerator(function* () {}), true);
  });

  it('sync function', () => {
    assertEquals(isGenerator(() => {}), false);
  });

  it('async function', () => {
    assertEquals(isGenerator(async () => {}), false);
  });
});

describe('isAsyncGenerator', () => {
  it('async generator function', () => {
    assertEquals(isAsyncGenerator(async function* () {}), true);
  });

  it('generator function', () => {
    assertEquals(isAsyncGenerator(function* () {}), false);
  });

  it('async function', () => {
    assertEquals(isAsyncGenerator(async () => {}), false);
  });
});

describe('isIterable', () => {
  it('array', () => {
    assertEquals(isIterable([]), true);
  });

  it('string', () => {
    assertEquals(isIterable('ab'), true);
  });

  it('number primitive', () => {
    assertEquals(isIterable(1), false);
  });

  it('null', () => {
    assertEquals(isIterable(null), false);
  });

  it('plain object', () => {
    assertEquals(isIterable({}), false);
  });
});

describe('isAsyncIterable', () => {
  it('object with async iterator', () => {
    assertEquals(isAsyncIterable({
      [Symbol.asyncIterator]: async function* () { yield 1; },
    }), true);
  });

  it('array', () => {
    assertEquals(isAsyncIterable([]), false);
  });

  it('sync iterable only', () => {
    assertEquals(isAsyncIterable({ [Symbol.iterator]: () => {} }), false);
  });
});

describe('isPromise', () => {
  it('resolved promise', () => {
    assertEquals(isPromise(Promise.resolve(1)), true);
  });

  it('pending promise', () => {
    assertEquals(isPromise(new Promise(() => {})), true);
  });

  it('thenable', () => {
    assertEquals(isPromise({ then() {} }), false);
  });

  it('number primitive', () => {
    assertEquals(isPromise(42), false);
  });

  it('undefined', () => {
    assertEquals(isPromise(undefined), false);
  });
});

describe('isTemplateCall', () => {
  it('tagged template arguments', () => {
    const tagged = [Object.assign(['x'], { raw: ['x'] })];
    assertEquals(isTemplateCall(tagged), true);
  });

  it('plain string array', () => {
    assertEquals(isTemplateCall(['x']), false);
  });

  it('nested array without raw', () => {
    assertEquals(isTemplateCall([[1, 2]]), false);
  });

  it('empty arguments', () => {
    assertEquals(isTemplateCall([]), false);
  });
});

describe('callFn', () => {
  it('calls functions and passes through values', () => {
    assertEquals(callFn(() => 2), 2);
    assertEquals(callFn(9), 9);
  });
});

describe('toFn', () => {
  it('wraps values and keeps functions', () => {
    assertEquals(toFn(4)(), 4);
    assertEquals(toFn(() => 5)(), 5);
  });
});

describe('unwrapFn', () => {
  it('unwraps nested functions', () => {
    assertEquals(unwrapFn(() => () => 3), 3);
    assertEquals(unwrapFn(8), 8);
  });
});

describe('templateCallToArray', () => {
  it('interleaves tagged template parts', () => {
    const parts = Object.assign(['a', 'c'], { raw: ['a', 'c'] });
    assertEquals(templateCallToArray([parts, 'b']), ['a', 'b', 'c']);
    assertEquals(templateCallToArray(['x', 'y']), ['x', 'y']);
    const tailOnly = Object.assign(['only'], { raw: ['only'] });
    assertEquals(templateCallToArray([tailOnly]), ['only']);
  });
});

describe('objectEntriesDeep', () => {
  it('collects nested leaf paths', () => {
    const entries = [...objectEntriesDeep({ a: { b: 1 }, c: 2 })];
    assertEquals(entries, [[['a', 'b'], 1], [['c'], 2]]);
    assertEquals([...objectEntriesDeep(42)], [[[], 42]]);
  });
});

describe('objectMap', () => {
  it('maps objects and arrays', () => {
    assertEquals(objectMap({ a: 1 }, (v, k, o) => v + k.length + Object.keys(o).length), { a: 3 });
  });
});

describe('objectMapper', () => {
  it('creates reusable object mappers', () => {
    assertEquals(objectMapper(v => v + 1)([10, 20]), [11, 21]);
  });
});

describe('objectMapDeep', () => {
  it('maps deep values and primitive roots', () => {
    const src = { a: { b: 2 }, c: 3 };
    const mapped = objectMapDeep(src, (v, keys, root) =>
      typeof v == 'number' ? `${keys.join('.')}:${v}:${root === src}` : v
    );
    assertEquals(mapped, { a: { b: 'a.b:2:true' }, c: 'c:3:true' });
    assertEquals(objectMapDeep(100, (v, keys) => [keys, v]), [ [], 100 ]);
  });
});

describe('objectMapperDeep', () => {
  it('creates reusable deep mappers', () => {
    const src = { a: { b: 2 }, c: 3 };
    assertEquals(objectMapperDeep(v => typeof v == 'number' ? v + 1 : v)(src), { a: { b: 3 }, c: 4 });
  });
});

describe('objectPick', () => {
  it('picks selected keys', () => {
    assertEquals(objectPick({ a: 1, b: 2 }, ['b']), { b: 2 });
    assertEquals(objectPick({ a: 1 }, []), {});
  });
});

describe('objectPicker', () => {
  it('creates reusable key pickers', () => {
    assertEquals(objectPicker(['a'])({ a: 1, b: 2 }), { a: 1 });
  });
});
