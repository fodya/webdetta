// Example

import { Context } from "@webdetta/context/sync";
import { assertEquals } from "@std/assert";

const requestId = Context();
requestId.run(42, () => {
  assertEquals(requestId(), 42);
});
