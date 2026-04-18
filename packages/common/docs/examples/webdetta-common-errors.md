### `webdetta/common/errors`

Error handling utilities for throwing errors, catching exceptions, and managing uncaught errors. Provides both synchronous and asynchronous error handling with runtime-aware implementations.

<details>
<summary><strong>err(...args)</strong></summary>

Throws an Error with support for both template literal syntax and regular function call syntax.

**Parameters:**
- Template literal: Tagged template literal with interpolated values
- Regular call: Any arguments (passed to `Error` constructor)

**Returns:**
- `never`: Always throws, never returns

**Examples:**
```javascript
import { err } from 'webdetta/common/errors';

const value = 42;
err`Invalid value: ${value}`;

err('Something went wrong');

err('Error code:', 500, 'Details:', details);
```

</details>

<details>
<summary><strong>catchErrors(f, handler)</strong></summary>

Wraps a function to automatically catch and handle errors.

**Parameters:**
- `f` (Function): The function to wrap with error handling
- `handler` (Function, optional): Error handler function. Default: `catchErrors.handler` (logs to console)

**Returns:**
- `Function`: Wrapped function that catches all errors

**Examples:**
```javascript
import { catchErrors } from 'webdetta/common/errors';

const safeFn = catchErrors(() => {
  throw new Error('Oops!');
});
safeFn(); // Error caught and logged to console, no exception thrown

const safeAsync = catchErrors(async () => {
  await fetch('/api/data');
  throw new Error('Network error');
}, (error) => {
  console.error('Caught error:', error);
  // Output: 'Caught error: Error: Network error'
});
await safeAsync(); // Promise resolves, error handled
```

</details>

<details>
<summary><strong>handleUncaught({ exception, rejection })</strong></summary>

Sets up global error handlers for uncaught exceptions and unhandled promise rejections.

**Parameters:**
- `options` (object, optional): Configuration object
  - `exception` (Function, optional): Handler for uncaught exceptions
  - `rejection` (Function, optional): Handler for unhandled promise rejections

**Returns:**
- `void`: Sets up global handlers

**Examples:**
```javascript
import { handleUncaught } from 'webdetta/common/errors';

handleUncaught();
// Sets up default handlers that log to console

handleUncaught({
  exception: (msg, url, lineNo) => {
    console.error('Uncaught exception:', msg, 'at', url, ':', lineNo);
    // Output when uncaught exception occurs:
    // 'Uncaught exception: Error message at file.js:42'
  }
});

handleUncaught({
  rejection: (event) => {
    console.error('Unhandled rejection:', event.reason);
    // Output when unhandled rejection occurs:
    // 'Unhandled rejection: Error reason'
  }
});
```

</details>
