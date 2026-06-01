import { describe, it } from "jsr:@std/testing/bdd";
import { assertEquals } from "jsr:@std/assert";
import { toAttributeName, toCssPropertyName } from "@webdetta/common/dom";

describe("toAttributeName", () => {
  it("converts camelCase to kebab-case without a leading dash", () => {
    assertEquals(toAttributeName("fooBar"), "foo-bar");
    assertEquals(toAttributeName("FooBar"), "foo-bar");
    assertEquals(toAttributeName("WebkitTransform"), "webkit-transform");
  });
});

describe("toCssPropertyName", () => {
  it("converts camelCase to kebab-case with a leading dash on uppercase starts", () => {
    assertEquals(toCssPropertyName("fooBar"), "foo-bar");
    assertEquals(toCssPropertyName("FooBar"), "-foo-bar");
    assertEquals(toCssPropertyName("WebkitTransform"), "-webkit-transform");
  });
});
