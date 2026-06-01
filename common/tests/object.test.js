import { describe, it } from "jsr:@std/testing/bdd";
import { assertEquals } from "jsr:@std/assert";
import {
  objectEntriesDeep,
  objectMap,
  objectMapDeep,
  objectMapper,
  objectMapperDeep,
  objectPick,
  objectPicker,
} from "@webdetta/common/object";

describe("objectEntriesDeep", () => {
  it("yields leaf paths paired with their values", () => {
    const entries = [...objectEntriesDeep({ a: { b: 1 }, c: 2 })];
    assertEquals(entries, [[["a", "b"], 1], [["c"], 2]]);
    assertEquals([...objectEntriesDeep(42)], [[[], 42]]);
  });
});

describe("objectMap", () => {
  it("transforms values using the key and owning object", () => {
    assertEquals(
      objectMap({ a: 1 }, (v, k, o) => v + k.length + Object.keys(o).length),
      { a: 3 },
    );
  });
});

describe("objectMapper", () => {
  it("returns a reusable mapping function", () => {
    assertEquals(objectMapper((v) => v + 1)([10, 20]), [11, 21]);
  });
});

describe("objectMapDeep", () => {
  it("maps deep leaves and passes key path and root to the callback", () => {
    const src = { a: { b: 2 }, c: 3 };
    const mapped = objectMapDeep(
      src,
      (v, keys, root) =>
        typeof v == "number" ? `${keys.join(".")}:${v}:${root === src}` : v,
    );
    assertEquals(mapped, { a: { b: "a.b:2:true" }, c: "c:3:true" });
    assertEquals(objectMapDeep(100, (v, keys) => [keys, v]), [[], 100]);
  });
});

describe("objectMapperDeep", () => {
  it("returns a reusable deep mapping function", () => {
    const src = { a: { b: 2 }, c: 3 };
    assertEquals(
      objectMapperDeep((v) => typeof v == "number" ? v + 1 : v)(src),
      { a: { b: 3 }, c: 4 },
    );
  });
});

describe("objectPick", () => {
  it("returns only the keys requested", () => {
    assertEquals(objectPick({ a: 1, b: 2 }, ["b"]), { b: 2 });
    assertEquals(objectPick({ a: 1 }, []), {});
  });
});

describe("objectPicker", () => {
  it("returns a reusable picker for a fixed key set", () => {
    assertEquals(objectPicker(["a"])({ a: 1, b: 2 }), { a: 1 });
  });
});
