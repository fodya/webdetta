// Example

import { assertEquals } from "@std/assert";
import { Element } from "@webdetta/realdom/base";
import { el } from "@webdetta/realdom";

assertEquals(typeof el, "object");
assertEquals(typeof Element, "function");

if (typeof document !== "undefined") {
  const node = el.Div("hi");
  assertEquals(node.tagName, "DIV");
}
