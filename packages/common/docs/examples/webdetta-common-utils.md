### `webdetta/common/utils`

General-purpose utilities for throttling, memoization, error handling, data formatting and more.

<details>
<summary><strong>isAsyncFunction(f)</strong></summary>

```javascript
import { isAsyncFunction } from 'webdetta/common/utils';

// Check if function is async
isAsyncFunction(async () => {}); // true
isAsyncFunction(() => {}); // false
```

</details>

<details>
<summary><strong>isPromise(d)</strong></summary>

```javascript
import { isPromise } from 'webdetta/common/utils';

// Check if value is a promise
isPromise(Promise.resolve()); // true
isPromise(42); // false
```

</details>

<details>
<summary><strong>callFn(d)</strong></summary>

```javascript
import { callFn } from 'webdetta/common/utils';

// Call function or return value
callFn(() => 42); // 42
callFn(42); // 42
```

</details>

<details>
<summary><strong>unwrapFn(d)</strong></summary>

```javascript
import { unwrapFn } from 'webdetta/common/utils';

// Unwrap nested functions
unwrapFn(() => () => () => 42); // 42
unwrapFn(42); // 42
```

</details>

<details>
<summary><strong>toFn(d)</strong></summary>

```javascript
import { toFn } from 'webdetta/common/utils';

// Convert value to function
toFn(42)(); // 42
toFn(() => 42)(); // 42
```

</details>

<details>
<summary><strong>S`template`</strong></summary>

```javascript
import { S } from 'webdetta/common/utils';

// Split template string into array of words
S`hello world`; // ['hello', 'world']
S`foo bar baz`; // ['foo', 'bar', 'baz']
```

</details>

<details>
<summary><strong>once(f)</strong></summary>

```javascript
import { once } from 'webdetta/common/utils';

// Execute function only once
const init = once(() => {
  console.log('Initialized');
  return 'done';
});

init(); // Console: 'Initialized', returns: 'done'
init(); // Console: (no output), returns: 'done' (cached)
init(); // Console: (no output), returns: 'done' (cached)
```

</details>

<details>
<summary><strong>sleep(t)</strong></summary>

```javascript
import { sleep } from 'webdetta/common/utils';

// Sleep/delay
await sleep(1000); // Wait 1 second
```

</details>

<details>
<summary><strong>jitter.full(delay) | jitter.equal(delay) | jitter.decorrelated(delay, prevDelay)</strong></summary>

```javascript
import { jitter } from 'webdetta/common/utils';

// Jitter functions for randomization
jitter.full(1000); // Returns: random number between 0-1000 (e.g., 342.5)
jitter.equal(1000); // Returns: random number between 500-1000 (e.g., 723.8)
jitter.decorrelated(1000, 500); // Returns: random number based on previous delay (e.g., 856.2)
```

</details>

<details>
<summary><strong>backoff({ retries, delay, minDelay, maxDelay, jitter, onError }, func)</strong></summary>

```javascript
import { backoff } from 'webdetta/common/utils';

// Exponential backoff with retries
await backoff({
  retries: 3,
  delay: { base: 100, factor: 2 }, // 100ms, 200ms, 400ms
  minDelay: 50,
  maxDelay: 2000,
  jitter: 'equal',
  onError: (err) => console.error(err)
  // Console on error: Error message (logged 3 times if all retries fail)
}, async () => {
  return await fetch('/api/data');
});
// Attempts: immediate, then after ~100ms, then after ~200ms, then after ~400ms
// Returns: fetch result on success, throws last error if all retries fail
```

</details>

<details>
<summary><strong>cached(f, keyFn)</strong></summary>

```javascript
import { cached } from 'webdetta/common/utils';

// Cache function results
const expensive = cached((n) => {
  console.log('Computing...');
  return n * 2;
}, (n) => String(n)); // Custom key function

expensive(5); // Console: 'Computing...', returns: 10
expensive(5); // Console: (no output), returns: 10 (cached)
expensive(10); // Console: 'Computing...', returns: 20
```

</details>

<details>
<summary><strong>isTemplateCall(args)</strong></summary>

```javascript
import { isTemplateCall } from 'webdetta/common/utils';

// Check if arguments are from template literal
isTemplateCall([['hello'], 'world']); // true (template call)
isTemplateCall(['hello', 'world']); // false
```

</details>

<details>
<summary><strong>templateCallToArray(args)</strong></summary>

```javascript
import { templateCallToArray } from 'webdetta/common/utils';

// Convert template call to array
templateCallToArray([['Hello ', '!'], 'world']);
// ['Hello ', 'world', '!']
```

</details>

<details>
<summary><strong>throttle(f)</strong></summary>

```javascript
import { throttle } from 'webdetta/common/utils';

// Basic async throttle - Prevents concurrent executions
// If already running, returns the existing promise
const fetchData = throttle(async () => {
  return await fetch('/api/data');
});
// Multiple calls = only one request at a time
const promise1 = fetchData(); // Starts request
const promise2 = fetchData(); // Returns same promise as promise1
const promise3 = fetchData(); // Returns same promise as promise1
// promise1 === promise2 === promise3 (all same promise)
```

**Behavior**: Prevents concurrent executions. If already running, returns the existing promise.

**Use case**: Prevent overlapping async operations (e.g., API calls).

</details>

<details>
<summary><strong>throttle.sync(f)</strong></summary>

```javascript
import { throttle } from 'webdetta/common/utils';

// Synchronous throttle - Prevents concurrent executions synchronously
// If locked, returns immediately without executing
const updateUI = throttle.sync(() => {
  // Heavy DOM manipulation
});
// If already running, subsequent calls are ignored
```

**Behavior**: Prevents concurrent executions synchronously. If locked, returns immediately without executing.

**Use case**: Prevent overlapping synchronous operations (e.g., DOM updates).

</details>

<details>
<summary><strong>throttle.T(delay, f)</strong></summary>

```javascript
import { throttle } from 'webdetta/common/utils';

// Throttle with delay before execution
// Waits delay ms before executing, then uses basic throttle
const search = throttle.T(300, async (query) => {
  return await fetch(`/api/search?q=${query}`);
});
// Waits 300ms, then executes (only one at a time)
search('test'); // Waits 300ms, then fetches
search('test2'); // Waits 300ms, then fetches (queued after first completes)
```

**Behavior**: Waits `delay` ms before executing, then uses basic throttle.

**Use case**: Delay execution and prevent overlapping (e.g., search after typing).

</details>

<details>
<summary><strong>throttle.Ti(delay, f)</strong></summary>

```javascript
import { throttle } from 'webdetta/common/utils';

// Throttle with delay after execution
// Executes immediately, then waits delay ms before allowing next execution
const apiCall = throttle.Ti(1000, async () => {
  return await fetch('/api');
});
// Executes immediately, then waits 1s before next call
apiCall(); // Executes immediately
apiCall(); // Waits 1s, then executes
apiCall(); // Waits 1s more, then executes
```

**Behavior**: Executes immediately, then waits `delay` ms before allowing the next execution.

**Use case**: Rate limiting (e.g., API rate limits).

</details>

<details>
<summary><strong>throttle.Td(delay, f)</strong></summary>

```javascript
import { throttle } from 'webdetta/common/utils';

// Debounce throttle
// Waits delay ms of inactivity before executing
// Each new call cancels the previous timer
const handleResize = throttle.Td(250, () => {
  console.log('Window resized');
});
// Only executes 250ms after user stops resizing
handleResize(); // Timer starts (250ms)
handleResize(); // Timer resets (250ms)
handleResize(); // Timer resets (250ms)
// After 250ms of no calls: Console: 'Window resized'
```

**Behavior**: Waits `delay` ms of inactivity before executing. Each new call cancels the previous timer.

**Use case**: Debouncing (e.g., search input, resize handlers).

</details>

<details>
<summary><strong>Throttle Comparison</strong></summary>

| Type | Delay | Execution | Cancels Previous | Use Case |
|------|-------|-----------|------------------|----------|
| `throttle` | None | Immediate | No (queues) | Prevent concurrent async |
| `throttle.sync` | None | Immediate | Yes (ignores) | Prevent concurrent sync |
| `throttle.T` | Before | After delay | No (queues) | Delay + prevent overlap |
| `throttle.Ti` | After | Immediate | No (queues) | Rate limiting |
| `throttle.Td` | Before | After delay | Yes (cancels) | Debouncing |

**Visual Timeline Example**

For rapid calls at t=0, 100, 200, 300ms with 200ms delay:

- `throttle`: Executes at t=0, queues others
- `throttle.sync`: Executes at t=0, ignores others
- `throttle.T(200)`: Executes at t=200 (first call)
- `throttle.Ti(200)`: Executes at t=0, then t=200, then t=400
- `throttle.Td(200)`: Executes at t=500 (200ms after last call at t=300)

</details>
