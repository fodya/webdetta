# I18n

Internationalization toolkit for translating UI texts.

## Usage

```javascript
import { I18N } from 'webdetta/i18n';

const translations = {
  en: {
    hello: 'Hello',
    greeting: (name) => `Hello, ${name}!`,
    nested: {
      key: 'Nested value'
    }
  },
  fr: {
    hello: 'Bonjour',
    greeting: (name) => `Bonjour, ${name} !`,
    nested: {
      key: 'Valeur imbriquée'
    }
  },
  ru: {
    hello: 'Привет',
    greeting: (name) => `Привет, ${name}!`,
    nested: {
      key: 'Вложенное значение'
    }
  },
};

const t = I18N({ fallbackLang: 'en', translations });

// Set language
t.lang('ru');

// Simple translation
console.log(t('hello')); // 'Привет'

// Translation with function
console.log(t('greeting', 'John')); // 'Bonjour, John!'

// Nested keys
console.log(t('nested.key')); // 'Valeur imbriquée'
```

## API

`const t = I18N({ fallbackLang, translations, onNotFound })`

Params:
- `fallbackLang` string: Default language to use when translation is not found in current language
- `translations` object: Object[language][key] -> string | function
- `onNotFound(key)` function: Function to be called when a translation is not found

Returns a function `t`:
- `t(key)` - Returns translation associated with `key`
- `t(key, ...args)` - Calls translation function associated with `key`, by passing `args` to it
- `t.lang()` - Returns current language
- `t.lang(v)` - Sets current language

### Custom onNotFound Handler

```javascript
const t = I18N({
  fallbackLang: 'en',
  translations,
  onNotFound: (key) => {
    console.warn(`Missing translation: ${key}`);
    return key;
  }
});
```

