# backoff()

```javascript
import { backoff } from 'webdetta/execution';

let attempt = 0;
const result = await backoff({
  retries: 3,
  delay: { base: 100, factor: 2 },
  jitter: false,
}, async () => {
  attempt++;
  if (attempt < 3) throw new Error('retry');
  return 'ok';
});

console.log(result); // 'ok'
```
