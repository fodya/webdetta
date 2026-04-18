# Bind Async Context

```javascript
import { AsyncContext } from 'webdetta/context/async';

const userId = AsyncContext(null);

const task = userId.bind(7, async () => {
  await Promise.resolve();
  return userId();
});

console.log(await task()); // 7
console.log(userId()); // null
```
