# Bind Sync Context

```javascript
import { Context } from 'webdetta/context/sync';

const locale = Context('en');

const greet = locale.bind('ru', (name) => {
  console.log(locale(), name);
});

greet('Fedot'); // 'ru', 'Fedot'
console.log(locale()); // 'en'
```
