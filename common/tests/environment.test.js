import { describe, it } from "jsr:@std/testing/bdd";
import { assertEquals } from "jsr:@std/assert";
import {
  isClientRuntime,
  isServerRuntime,
  runtime,
} from "@webdetta/common/environment";

describe("runtime", () => {
  it("returns a known runtime and consistent client/server flags", () => {
    assertEquals(
      ["browser", "node", "webworker", "jsdom", "deno", "bun"].includes(
        runtime,
      ),
      true,
    );
    assertEquals(
      isClientRuntime,
      ["browser", "webworker", "jsdom"].includes(runtime),
    );
    assertEquals(isServerRuntime, !isClientRuntime);
  });
});
