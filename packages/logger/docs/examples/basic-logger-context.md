# Basic Logger Context

```javascript
import { logger, withLogger } from 'webdetta/logger';

const messages = [];
const custom = { info: (...args) => messages.push(args.join(' ')) };

withLogger(custom, () => {
  logger.info('hello', 'world');
});

console.log(messages); // ['hello world']
```
