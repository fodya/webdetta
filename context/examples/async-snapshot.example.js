// Example

import { AsyncContext } from "@webdetta/context/async";
import { delay } from "@std/async";
import { assertEquals } from "@std/assert";

const user = AsyncContext();

const snapshot1 = AsyncContext.Snapshot().set(user, "Alice");
const snapshot2 = snapshot1.set(user, "Bob");

snapshot1.run(async () => {
  await delay(100);
  assertEquals(user(), "Alice");
});

snapshot2.run(async () => {
  await delay(100);
  assertEquals(user(), "Bob");
});
