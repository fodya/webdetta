# Sync Context Basics

```javascript
import { Context } from 'webdetta/context/sync';

const requestId = Context('anonymous');

console.log(requestId()); // 'anonymous'

requestId.run('req-42', () => {
  console.log(requestId()); // 'req-42'
});

console.log(requestId()); // 'anonymous'
```
