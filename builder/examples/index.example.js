// Example

import { assertEquals } from "@std/assert";
import { Builder } from "@webdetta/builder";

const math = Builder((tasks, value) =>
  tasks.reduce((acc, { names, args }) => {
    const [name] = names;
    return ({ add: (x, n) => x + n, multiply: (x, n) => x * n })[name](acc, ...args);
  }, value)
);

const expr = math.add(2).multiply(3);
assertEquals(Builder.launch(expr, 5), 21);
