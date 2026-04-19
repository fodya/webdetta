### `webdetta/config/handle-uncaught-errors`

Automatically handles global uncaught errors and logs them to console. Prevents a NodeJS process from exiting on an unhandled promise rejection.

```javascript
import 'webdetta/config/handle-uncaught-errors';

// Uncaught errors are now automatically handled
```

<details>
<summary><strong>Examples</strong></summary>

#### Example 1: Basic Usage - Errors are automatically logged to console

First, import the module to enable automatic error handling:

```javascript
import 'webdetta/config/handle-uncaught-errors';
```

Now any uncaught errors or unhandled rejections will be logged to console:

```javascript
// Throwing an uncaught error
// After importing the module, this will be logged to console instead of crashing
throw new Error('This uncaught error will be logged to console');

// Rejecting a promise without handling it
// After importing the module, this will be logged to console instead of causing unhandled rejection
Promise.reject(new Error('This unhandled rejection will be logged to console'));
```

#### Example 2: Custom Configuration

You can configure the error handling behavior using `handleUncaught` function:

```javascript
import { handleUncaught } from 'webdetta/common/errors';

handleUncaught({
  // Custom handler for uncaught exceptions (synchronous errors)
  exception: (msg, url, lineNo) => {
    console.error('Custom exception handler:', msg, 'at', url, ':', lineNo);
    // You can send to error tracking service, show user notification, etc.
  },
  
  // Custom handler for unhandled promise rejections (asynchronous errors)
  rejection: (event) => {
    console.error('Custom rejection handler:', event.reason);
    // You can send to error tracking service, show user notification, etc.
  }
});
```

</details>
