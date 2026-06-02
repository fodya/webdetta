// Example

import { assertEquals } from "@std/assert";
import { genKey } from "@webdetta/rpc";

const key = genKey(8);
assertEquals(typeof key, "string");
assertEquals(key.length > 0, true);
