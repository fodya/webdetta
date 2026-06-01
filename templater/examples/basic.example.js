// Example

import { assertEquals } from "@std/assert";
import { Templater } from "@webdetta/templater";

const t = Templater({
  operatorSymbol: "$",
  openBracket: "{",
  closeBracket: "}",
  argumentsSeparator: ",",
});
t.register("", (ctx, args) => String(ctx[args[0]] ?? ""));
t.register("upper", (ctx, args, render) => render(args, ctx).toUpperCase());
t.register(
  "money",
  (ctx, args, render) => "$" + Number(render(args[0], ctx)).toFixed(2),
);

const template =
  "Hello ${customerName}, your order total is $money{${total}}. " +
  "Status: $upper{${status}}";

const text = t.render(template, {
  customerName: "Ada",
  total: 42,
  status: "processing",
});
assertEquals(text, "Hello Ada, your order total is $42.00. Status: PROCESSING");

const nodes = t.parse(template);
assertEquals(nodes, {
  operator: null,
  args: [
    "Hello ",
    { operator: "", args: ["customerName"] },
    ", your order total is ",
    { operator: "money", args: [{ operator: "", args: ["total"] }] },
    ". Status: ",
    { operator: "upper", args: [{ operator: "", args: ["status"] }] },
  ],
});
