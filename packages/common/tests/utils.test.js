import { describe, it } from 'jsr:@std/testing/bdd';
import { assertEquals, assertThrows } from 'jsr:@std/assert';
import {
  arr,
  err,
  isObject,
  isPlainObject,
  isPlainFunction,
  isAsyncFunction,
  isGeneratorFunction,
  isAsyncGeneratorFunction,
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
  it('tokenizes whitespace-separated template into an array', () => {
    assertEquals(arr` alpha   beta
      gamma `, ['alpha', 'beta', 'gamma']);
  });

  it('returns an empty array for an empty template', () => {
    assertEquals(arr``, []);
  });
});

describe('err', () => {
  it('interpolates template expressions into the error message', () => {
    try {
      const id = 7;
      err`failure ${id}`;
    } catch (e) {
      assertEquals(e.message, 'failure 7');
    }
  });

  it('throws when called without a tagged template', () => {
    assertThrows(() => err('plain'), Error, 'plain');
  });
});

describe('isObject', () => {
  it('accepts a plain object literal', () => {
    assertEquals(isObject({}), true);
  });

  it('accepts an array', () => {
    assertEquals(isObject([]), true);
  });

  it('rejects null', () => {
    assertEquals(isObject(null), false);
  });

  it('rejects number primitives', () => {
    assertEquals(isObject(0), false);
  });
});

describe('isPlainObject', () => {
  it('accepts an object literal with own keys', () => {
    assertEquals(isPlainObject({ a: 1 }), true);
  });

  it('rejects nullish values', () => {
    assertEquals(isPlainObject(null), false);
    assertEquals(isPlainObject(undefined), false);
  });

  it('rejects arrays', () => {
    assertEquals(isPlainObject([]), false);
  });

  it('rejects built-in instances like Date and RegExp', () => {
    assertEquals(isPlainObject(new Date()), false);
    assertEquals(isPlainObject(/x/), false);
  });
});

describe('isPlainFunction', () => {
  it('accepts a synchronous arrow function', () => {
    assertEquals(isPlainFunction(() => 1), true);
  });

  it('rejects an async function', () => {
    assertEquals(isPlainFunction(async () => 1), false);
  });

  it('rejects a generator function', () => {
    assertEquals(isPlainFunction(function* () {}), false);
  });
});

describe('isAsyncFunction', () => {
  it('accepts an async function', () => {
    assertEquals(isAsyncFunction(async () => 1), true);
  });

  it('rejects a synchronous function', () => {
    assertEquals(isAsyncFunction(() => 1), false);
  });

  it('rejects a generator function', () => {
    assertEquals(isAsyncFunction(function* () {}), false);
  });
});

describe('isGeneratorFunction', () => {
  it('accepts a synchronous generator function', () => {
    assertEquals(isGeneratorFunction(function* () {}), true);
  });

  it('rejects a plain synchronous function', () => {
    assertEquals(isGeneratorFunction(() => {}), false);
  });

  it('rejects an async function', () => {
    assertEquals(isGeneratorFunction(async () => {}), false);
  });
});

describe('isAsyncGeneratorFunction', () => {
  it('accepts an async generator function', () => {
    assertEquals(isAsyncGeneratorFunction(async function* () {}), true);
  });

  it('rejects a sync generator function', () => {
    assertEquals(isAsyncGeneratorFunction(function* () {}), false);
  });

  it('rejects a plain async function', () => {
    assertEquals(isAsyncGeneratorFunction(async () => {}), false);
  });
});

describe('isIterable', () => {
  it('accepts an array', () => {
    assertEquals(isIterable([]), true);
  });

  it('accepts a string', () => {
    assertEquals(isIterable('ab'), true);
  });

  it('rejects number primitives', () => {
    assertEquals(isIterable(1), false);
  });

  it('rejects null', () => {
    assertEquals(isIterable(null), false);
  });

  it('rejects a plain object without an iterator', () => {
    assertEquals(isIterable({}), false);
  });
});

describe('isAsyncIterable', () => {
  it('accepts an object that implements Symbol.asyncIterator', () => {
    assertEquals(isAsyncIterable({
      [Symbol.asyncIterator]: async function* () { yield 1; },
    }), true);
  });

  it('rejects a plain array', () => {
    assertEquals(isAsyncIterable([]), false);
  });

  it('rejects an object that only implements Symbol.iterator', () => {
    assertEquals(isAsyncIterable({ [Symbol.iterator]: () => {} }), false);
  });
});

describe('isPromise', () => {
  it('accepts a resolved promise', () => {
    assertEquals(isPromise(Promise.resolve(1)), true);
  });

  it('accepts a pending promise', () => {
    assertEquals(isPromise(new Promise(() => {})), true);
  });

  it('rejects a plain thenable', () => {
    assertEquals(isPromise({ then() {} }), false);
  });

  it('rejects number primitives', () => {
    assertEquals(isPromise(42), false);
  });

  it('rejects undefined', () => {
    assertEquals(isPromise(undefined), false);
  });
});

describe('isTemplateCall', () => {
  it('accepts arguments shaped like a tagged template call', () => {
    const tagged = [Object.assign(['x'], { raw: ['x'] })];
    assertEquals(isTemplateCall(tagged), true);
  });

  it('rejects a plain string array', () => {
    assertEquals(isTemplateCall(['x']), false);
  });

  it('rejects a nested array without a raw property', () => {
    assertEquals(isTemplateCall([[1, 2]]), false);
  });

  it('rejects an empty arguments list', () => {
    assertEquals(isTemplateCall([]), false);
  });
});

describe('callFn', () => {
  it('invokes functions and passes non-functions through unchanged', () => {
    assertEquals(callFn(() => 2), 2);
    assertEquals(callFn(9), 9);
  });
});

describe('toFn', () => {
  it('wraps values in a function and keeps existing functions intact', () => {
    assertEquals(toFn(4)(), 4);
    assertEquals(toFn(() => 5)(), 5);
  });
});

describe('unwrapFn', () => {
  it('unwraps nested function chains down to the final value', () => {
    assertEquals(unwrapFn(() => () => 3), 3);
    assertEquals(unwrapFn(8), 8);
  });
});

describe('templateCallToArray', () => {
  it('interleaves string parts with interpolated expressions', () => {
    const parts = Object.assign(['a', 'c'], { raw: ['a', 'c'] });
    assertEquals(templateCallToArray([parts, 'b']), ['a', 'b', 'c']);
    assertEquals(templateCallToArray(['x', 'y']), ['x', 'y']);
    const tailOnly = Object.assign(['only'], { raw: ['only'] });
    assertEquals(templateCallToArray([tailOnly]), ['only']);
  });
});

describe('objectEntriesDeep', () => {
  it('yields leaf paths paired with their values', () => {
    const entries = [...objectEntriesDeep({ a: { b: 1 }, c: 2 })];
    assertEquals(entries, [[['a', 'b'], 1], [['c'], 2]]);
    assertEquals([...objectEntriesDeep(42)], [[[], 42]]);
  });
});

describe('objectMap', () => {
  it('transforms values using the key and owning object', () => {
    assertEquals(objectMap({ a: 1 }, (v, k, o) => v + k.length + Object.keys(o).length), { a: 3 });
  });
});

describe('objectMapper', () => {
  it('returns a reusable mapping function', () => {
    assertEquals(objectMapper(v => v + 1)([10, 20]), [11, 21]);
  });
});

describe('objectMapDeep', () => {
  it('maps deep leaves and passes key path and root to the callback', () => {
    const src = { a: { b: 2 }, c: 3 };
    const mapped = objectMapDeep(src, (v, keys, root) =>
      typeof v == 'number' ? `${keys.join('.')}:${v}:${root === src}` : v
    );
    assertEquals(mapped, { a: { b: 'a.b:2:true' }, c: 'c:3:true' });
    assertEquals(objectMapDeep(100, (v, keys) => [keys, v]), [ [], 100 ]);
  });
});

describe('objectMapperDeep', () => {
  it('returns a reusable deep mapping function', () => {
    const src = { a: { b: 2 }, c: 3 };
    assertEquals(objectMapperDeep(v => typeof v == 'number' ? v + 1 : v)(src), { a: { b: 3 }, c: 4 });
  });
});

describe('objectPick', () => {
  it('returns only the keys requested', () => {
    assertEquals(objectPick({ a: 1, b: 2 }, ['b']), { b: 2 });
    assertEquals(objectPick({ a: 1 }, []), {});
  });
});

describe('objectPicker', () => {
  it('returns a reusable picker for a fixed key set', () => {
    assertEquals(objectPicker(['a'])({ a: 1, b: 2 }), { a: 1 });
  });
});
