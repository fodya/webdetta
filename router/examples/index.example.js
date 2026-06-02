// Example

import { assertEquals } from "@std/assert";
import { parsePath } from "@webdetta/router";

assertEquals(parsePath("/users/:id", "/users/42"), { id: "42" });
