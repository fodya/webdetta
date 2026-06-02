// Example

import { assertEquals } from "@std/assert";
import { Signal } from "@webdetta/reactivity/base";
import { r } from "@webdetta/reactivity";

const count = r.val(0);
assertEquals(count(), 0);
count.set(1);
assertEquals(count(), 1);

const tracked = new Signal({ get: () => count(), set: (v) => count.set(v) });
assertEquals(tracked.get(), 1);
