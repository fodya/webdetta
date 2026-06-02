// Example

import { assertEquals } from "@std/assert";
import { I18N } from "@webdetta/i18n";

const t = I18N({
  fallbackLang: "en",
  translations: {
    welcome: {
      en: (name) => `Hello, ${name}!`,
      fr: (name) => `Bonjour, ${name}!`,
    },
  },
});

assertEquals(t("welcome", "Ada"), "Hello, Ada!");
