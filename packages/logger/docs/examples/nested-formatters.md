# Nested Formatters

```javascript
import { logger, withLogger, withLoggerFormatter } from 'webdetta/logger';

withLogger(console, () => {
  withLoggerFormatter((args) => ['[app]', ...args], () => {
    logger.info('started');
  });
});
```
