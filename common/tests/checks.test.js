import { describe, it } from "jsr:@std/testing/bdd";
import { assertEquals } from "jsr:@std/assert";
import {
  isAsyncFunction,
  isAsyncGeneratorFunction,
  isAsyncIterable,
  isGeneratorFunction,
  isIterable,
  isObject,
  isPlainFunction,
  isPlainObject,
  isPromise,
  isTemplateCall,
} from "@webdetta/common/checks";

describe("isObject", () => {
  it("accepts a plain object literal", () => {
    assertEquals(isObject({}), true);
  });

  it("accepts an array", () => {
    assertEquals(isObject([]), true);
  });

  it("rejects null", () => {
    assertEquals(isObject(null), false);
  });

  it("rejects number primitives", () => {
    assertEquals(isObject(0), false);
  });
});

describe("isPlainObject", () => {
  it("accepts an object literal with own keys", () => {
    assertEquals(isPlainObject({ a: 1 }), true);
  });

  it("rejects nullish values", () => {
    assertEquals(isPlainObject(null), false);
    assertEquals(isPlainObject(undefined), false);
  });

  it("rejects arrays", () => {
    assertEquals(isPlainObject([]), false);
  });

  it("rejects built-in instances like Date and RegExp", () => {
    assertEquals(isPlainObject(new Date()), false);
    assertEquals(isPlainObject(/x/), false);
  });
});

describe("isPlainFunction", () => {
  it("accepts a synchronous arrow function", () => {
    assertEquals(isPlainFunction(() => 1), true);
  });

  it("rejects an async function", () => {
    assertEquals(isPlainFunction(async () => 1), false);
  });

  it("rejects a generator function", () => {
    assertEquals(isPlainFunction(function* () {}), false);
  });
});

describe("isAsyncFunction", () => {
  it("accepts an async function", () => {
    assertEquals(isAsyncFunction(async () => 1), true);
  });

  it("rejects a synchronous function", () => {
    assertEquals(isAsyncFunction(() => 1), false);
  });

  it("rejects a generator function", () => {
    assertEquals(isAsyncFunction(function* () {}), false);
  });
});

describe("isGeneratorFunction", () => {
  it("accepts a synchronous generator function", () => {
    assertEquals(isGeneratorFunction(function* () {}), true);
  });

  it("rejects a plain synchronous function", () => {
    assertEquals(isGeneratorFunction(() => {}), false);
  });

  it("rejects an async function", () => {
    assertEquals(isGeneratorFunction(async () => {}), false);
  });
});

describe("isAsyncGeneratorFunction", () => {
  it("accepts an async generator function", () => {
    assertEquals(isAsyncGeneratorFunction(async function* () {}), true);
  });

  it("rejects a sync generator function", () => {
    assertEquals(isAsyncGeneratorFunction(function* () {}), false);
  });

  it("rejects a plain async function", () => {
    assertEquals(isAsyncGeneratorFunction(async () => {}), false);
  });
});

describe("isIterable", () => {
  it("accepts an array", () => {
    assertEquals(isIterable([]), true);
  });

  it("accepts a string", () => {
    assertEquals(isIterable("ab"), true);
  });

  it("rejects number primitives", () => {
    assertEquals(isIterable(1), false);
  });

  it("rejects null", () => {
    assertEquals(isIterable(null), false);
  });

  it("rejects a plain object without an iterator", () => {
    assertEquals(isIterable({}), false);
  });
});

describe("isAsyncIterable", () => {
  it("accepts an object that implements Symbol.asyncIterator", () => {
    assertEquals(
      isAsyncIterable({
        [Symbol.asyncIterator]: async function* () {
          yield 1;
        },
      }),
      true,
    );
  });

  it("rejects a plain array", () => {
    assertEquals(isAsyncIterable([]), false);
  });

  it("rejects an object that only implements Symbol.iterator", () => {
    assertEquals(isAsyncIterable({ [Symbol.iterator]: () => {} }), false);
  });
});

describe("isPromise", () => {
  it("accepts a resolved promise", () => {
    assertEquals(isPromise(Promise.resolve(1)), true);
  });

  it("accepts a pending promise", () => {
    assertEquals(isPromise(new Promise(() => {})), true);
  });

  it("rejects a plain thenable", () => {
    assertEquals(isPromise({ then() {} }), false);
  });

  it("rejects number primitives", () => {
    assertEquals(isPromise(42), false);
  });

  it("rejects undefined", () => {
    assertEquals(isPromise(undefined), false);
  });
});

describe("isTemplateCall", () => {
  it("accepts arguments shaped like a tagged template call", () => {
    const tagged = [Object.assign(["x"], { raw: ["x"] })];
    assertEquals(isTemplateCall(tagged), true);
  });

  it("rejects a plain string array", () => {
    assertEquals(isTemplateCall(["x"]), false);
  });

  it("rejects a nested array without a raw property", () => {
    assertEquals(isTemplateCall([[1, 2]]), false);
  });

  it("rejects an empty arguments list", () => {
    assertEquals(isTemplateCall([]), false);
  });
});
