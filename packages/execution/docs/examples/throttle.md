# throttle()

```javascript
import { throttle } from 'webdetta/execution';

const load = throttle(async () => {
  await new Promise((r) => setTimeout(r, 50));
  return Date.now();
});

const a = load();
const b = load();
console.log(a === b); // true
```
