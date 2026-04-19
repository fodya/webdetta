# sleep()

```javascript
import { sleep } from 'webdetta/execution';

await sleep(100);
await sleep.before(100, () => console.log('before'));
await sleep.after(100, async () => 'done');
```
