// Example

import { assertEquals } from "@std/assert";
import { base64ToText, textToBase64 } from "@webdetta/convert";

const encoded = textToBase64("hello");
assertEquals(base64ToText(encoded), "hello");
