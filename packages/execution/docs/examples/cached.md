# cached()

```javascript
import { cached } from 'webdetta/execution';

const double = cached((n) => {
  console.log('compute', n);
  return n * 2;
});

double(5); // logs
 double(5); // cached
```
