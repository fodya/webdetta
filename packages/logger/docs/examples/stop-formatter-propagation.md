# Stop Formatter Propagation

```javascript
import { logger, withLogger, withLoggerFormatter } from 'webdetta/logger';

withLogger(console, () => {
  withLoggerFormatter(function (args) {
    this.stopPropagation = true;
    return ['[only-local]', ...args];
  }, () => {
    logger.warn('warning');
  });
});
```
