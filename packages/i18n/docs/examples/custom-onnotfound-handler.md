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
