// Example

import { Builder } from "@webdetta/builder";
import { assertEquals } from "@std/assert";

const math = Builder((tasks, value) =>
  tasks.reduce((acc, { names, args }) => {
    const [name] = names;
    return operations[name](acc, ...args);
  }, value)
);

const operations = {
  add: (x, n) => x + n,
  multiply: (x, n) => x * n,
};

const expr = math.add(2).multiply(3).add(-1);
const result = Builder.launch(expr, 5);

assertEquals(result, 20); // (5 + 2) * 3 - 1
