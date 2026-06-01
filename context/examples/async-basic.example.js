// Example

import { AsyncContext } from "@webdetta/context/async";
import { delay } from "@std/async";
import { assertEquals } from "@std/assert";

const requestId = AsyncContext();
await requestId.run(42, async () => {
  await delay(100);
  assertEquals(requestId(), 42);
});
