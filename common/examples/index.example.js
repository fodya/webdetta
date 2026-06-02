// Example

import { assertEquals } from "@std/assert";
import { toAttributeName } from "@webdetta/common/dom";
import { isClientRuntime } from "@webdetta/common/environment";

assertEquals(toAttributeName("fooBar"), "foo-bar");
assertEquals(typeof isClientRuntime, "boolean");
