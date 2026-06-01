import { describe, it } from "jsr:@std/testing/bdd";
import { assertEquals } from "jsr:@std/assert";
import {
  callFn,
  templateCallToArray,
  toFn,
  unwrapFn,
} from "@webdetta/common/func";

describe("callFn", () => {
  it("invokes functions and passes non-functions through unchanged", () => {
    assertEquals(callFn(() => 2), 2);
    assertEquals(callFn(9), 9);
  });
});

describe("toFn", () => {
  it("wraps values in a function and keeps existing functions intact", () => {
    assertEquals(toFn(4)(), 4);
    assertEquals(toFn(() => 5)(), 5);
  });
});

describe("unwrapFn", () => {
  it("unwraps nested function chains down to the final value", () => {
    assertEquals(unwrapFn(() => () => 3), 3);
    assertEquals(unwrapFn(8), 8);
  });
});

describe("templateCallToArray", () => {
  it("interleaves string parts with interpolated expressions", () => {
    const parts = Object.assign(["a", "c"], { raw: ["a", "c"] });
    assertEquals(templateCallToArray([parts, "b"]), ["a", "b", "c"]);
    assertEquals(templateCallToArray(["x", "y"]), ["x", "y"]);
    const tailOnly = Object.assign(["only"], { raw: ["only"] });
    assertEquals(templateCallToArray([tailOnly]), ["only"]);
  });
});
