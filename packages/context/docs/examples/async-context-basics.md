# Async Context Basics

```javascript
import { AsyncContext } from 'webdetta/context/async';

const traceId = AsyncContext('none');

await traceId.run('trace-1', async () => {
  await Promise.resolve();
  console.log(traceId()); // 'trace-1'
});

console.log(traceId()); // 'none'
```
