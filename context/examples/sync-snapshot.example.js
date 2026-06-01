// Example

import { Context } from "@webdetta/context/sync";
import { assertEquals } from "@std/assert";

const user = Context();

const snapshot1 = Context.Snapshot().set(user, "Alice");
const snapshot2 = snapshot1.set(user, "Bob");

snapshot1.run(() => {
  assertEquals(user(), "Alice");
});

snapshot2.run(() => {
  assertEquals(user(), "Bob");
});
