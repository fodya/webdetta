// Example

import { assertEquals } from "@std/assert";
import { AsyncContext } from "@webdetta/context/async";
import { Context } from "@webdetta/context/sync";

const requestId = Context();
requestId.run(42, () => {
  assertEquals(requestId(), 42);
});

const store = AsyncContext("default");
await store.run("session-1", async () => {
  assertEquals(store(), "session-1");
});
