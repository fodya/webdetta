// Example

import { assertEquals } from "@std/assert";
import { Templater } from "@webdetta/template";

const t = Templater({
  operatorSymbol: "$",
  openBracket: "{",
  closeBracket: "}",
  argumentsSeparator: ",",
});
t.register("", (ctx, args) => String(ctx[args[0]] ?? ""));

const text = t.render("Hello ${name}", { name: "Ada" });
assertEquals(text, "Hello Ada");
