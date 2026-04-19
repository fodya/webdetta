# Common

A collection of common modules not attributable to any specific submodule. These modules are used by many of the other modules throughout the webdetta library.

## Modules

### `webdetta/common/dom`

DOM-specific utility functions for browser environments. Provides helpers for text manipulation, element measurement, clipboard operations, asset loading, and layout management.

<details>
<summary><strong>kebab(s)</strong></summary>

Converts camelCase strings to kebab-case.

**Parameters:**
- `s` (string): The camelCase string to convert

**Returns:**
- `string`: The kebab-case version of the input string

**Examples:**
```javascript
import { kebab } from 'webdetta/common/dom';

kebab('camelCase'); // 'camel-case'
kebab('backgroundColor'); // 'background-color'
kebab('fontSize'); // 'font-size'
kebab('XMLHttpRequest'); // 'x-m-l-h-t-t-p-request'
```

</details>

<details>
<summary><strong>copyText(text)</strong></summary>

Copies text to the system clipboard. Automatically falls back to the legacy `execCommand` method if the modern Clipboard API is unavailable or fails.

**Parameters:**
- `text` (string): The text content to copy to clipboard

**Returns:**
- `Promise<void>`: Resolves when text is successfully copied

**Examples:**
```javascript
import { copyText } from 'webdetta/common/dom';

await copyText('Hello World');
await copyText('Fallback method');
```

</details>

<details>
<summary><strong>measureText(text, style)</strong></summary>

Measures the rendered dimensions (width and height) of text with specified CSS styles.

**Parameters:**
- `text` (string): The text to measure
- `style` (object | CSSStyleDeclaration, optional): CSS styles to apply. Can be a plain object with CSS properties or a `CSSStyleDeclaration` instance

**Returns:**
- `object`: An object with `width` and `height` properties (in pixels)

**Examples:**
```javascript
import { measureText } from 'webdetta/common/dom';

const { width, height } = measureText('Hello World');
// width: 77, height: 19 (example values in pixels)

const size = measureText('Hello', { 
  fontSize: '16px',
  fontFamily: 'Arial',
  fontWeight: 'bold'
});
// size: { width: 52, height: 19 }

const elementStyle = getComputedStyle(someElement);
const size = measureText('Text', elementStyle);
// size: { width: 32, height: 16 }
```

</details>

<details>
<summary><strong>autogrowInput({ element, text, multiline, whiteSpace })</strong></summary>

Automatically adjusts the size of an input or textarea element to fit its text content.

**Parameters:**
- `element` (HTMLElement): The input or textarea element to resize
- `text` (string): The text content to measure
- `multiline` (boolean, optional): If `true`, adjusts height (for textarea). If `false`, adjusts width (for input). Default: `false`
- `whiteSpace` (string, optional): CSS `white-space` value. Default: `'pre-wrap'`

**Returns:**
- `void`: Modifies the element's style directly

**Examples:**
```javascript
import { autogrowInput } from 'webdetta/common/dom';

autogrowInput({
  element: inputElement,
  text: 'Some text',
  multiline: false
});

autogrowInput({
  element: textareaElement,
  text: 'Long text\nwith multiple\nlines',
  multiline: true,
  whiteSpace: 'pre-wrap'
});
```

</details>

<details>
<summary><strong>saveBlob(filename, blob)</strong></summary>

Triggers a file download in the browser by creating a temporary anchor element with a blob URL.

**Parameters:**
- `filename` (string): The name of the file to download
- `blob` (Blob): The blob data to download

**Returns:**
- `void`: Triggers download immediately

**Examples:**
```javascript
import { saveBlob } from 'webdetta/common/dom';

const textBlob = new Blob(['Hello World'], { type: 'text/plain' });
saveBlob('hello.txt', textBlob);

const jsonBlob = new Blob([JSON.stringify({ data: 123 })], { 
  type: 'application/json' 
});
saveBlob('data.json', jsonBlob);

canvas.toBlob((blob) => {
  saveBlob('image.png', blob);
}, 'image/png');
```

</details>

<details>
<summary><strong>colorToHex(colorStr)</strong></summary>

Converts any CSS color string (named colors, RGB, RGBA, HSL, etc.) to hexadecimal format.

**Parameters:**
- `colorStr` (string): Any valid CSS color string

**Returns:**
- `string`: Hexadecimal color string (e.g., `'#ff0000'`)

**Examples:**
```javascript
import { colorToHex } from 'webdetta/common/dom';

colorToHex('rgb(255, 0, 0)'); // '#ff0000'
colorToHex('red'); // '#ff0000'
colorToHex('rgba(0, 255, 0, 0.5)'); // '#00ff00'
colorToHex('hsl(120, 100%, 50%)'); // '#00ff00'
colorToHex('#abc'); // '#aabbcc'
```

</details>

<details>
<summary><strong>forceReflow(elem)</strong></summary>

Forces the browser to perform a layout recalculation (reflow) by reading a layout-dependent property.

**Parameters:**
- `elem` (HTMLElement): The element to force reflow on

**Returns:**
- `void`: Side effect only (triggers reflow)

**Examples:**
```javascript
import { forceReflow } from 'webdetta/common/dom';

element.style.opacity = '0';
forceReflow(element);
element.style.opacity = '1';

element.style.display = 'block';
forceReflow(element);
```

</details>

<details>
<summary><strong>setLayoutWidth({ width, container, containerWidth, containerHeight, aspectRatio, method })</strong></summary>

Sets a fixed layout width on a container and scales it to fit the viewport using zoom or CSS transform.

**Parameters:**
- `width` (number | function): Fixed width in pixels, or function returning width
- `container` (HTMLElement, optional): Container element to apply layout to. Default: `document.body`
- `containerWidth` (function, optional): Function returning container width. Default: `() => window.innerWidth`
- `containerHeight` (function, optional): Function returning container height. Default: `() => window.innerHeight`
- `aspectRatio` (number | null, optional): Aspect ratio constraint (width/height). If provided, maintains aspect ratio when scaling
- `method` ('zoom' | 'scale', optional): Scaling method. `'zoom'` uses CSS `zoom` property, `'scale'` uses CSS `transform: scale()`. Default: `'zoom'`

**Returns:**
- `void`: Sets up resize listeners and applies layout

**Examples:**
```javascript
import { setLayoutWidth } from 'webdetta/common/dom';

setLayoutWidth({
  width: 1920,
  method: 'zoom'
});

setLayoutWidth({
  width: 1920,
  aspectRatio: 16/9,
  method: 'zoom'
});

setLayoutWidth({
  width: 1920,
  method: 'scale'
});
```

</details>

<details>
<summary><strong>isEventInside(event, target)</strong></summary>

Checks if an event's target (or any element in its composed path) is inside a given target element.

**Parameters:**
- `event` (Event): The DOM event to check
- `target` (HTMLElement): The element to check if event is inside

**Returns:**
- `boolean`: `true` if event target is inside the given element, `false` otherwise

**Examples:**
```javascript
import { isEventInside } from 'webdetta/common/dom';

document.addEventListener('click', (event) => {
  const container = document.getElementById('container');
  if (isEventInside(event, container)) {
    console.log('Clicked inside container');
  }
});
```

</details>

<details>
<summary><strong>L</strong></summary>

A Promise that resolves when the window's `load` event fires.

**Examples:**
```javascript
import { L } from 'webdetta/common/dom';

await L;
console.log('Page fully loaded');

async function init() {
  await L;
  initializeApp();
}
```

</details>

<details>
<summary><strong>DCL</strong></summary>

A Promise that resolves when the `DOMContentLoaded` event fires.

**Examples:**
```javascript
import { DCL } from 'webdetta/common/dom';

await DCL;
console.log('DOM ready');

async function setup() {
  await DCL;
  setupEventListeners();
}
```

</details>

### `webdetta/common/environment`

JavaScript runtime environment detection utilities. Safely detects the execution environment (browser, Node.js, Web Worker, jsdom, Deno, Bun) and provides device-specific information (mobile detection).

<details>
<summary><strong>runtime</strong></summary>

Detects the JavaScript runtime environment.

**Returns:**
- `string | undefined`: The detected runtime environment, or `undefined` if unknown

**Possible Values:**
- `'browser'`: Standard browser environment
- `'node'`: Node.js runtime
- `'webworker'`: Web Worker context
- `'jsdom'`: jsdom testing environment
- `'deno'`: Deno runtime
- `'bun'`: Bun runtime
- `undefined`: Unknown or unsupported environment

**Examples:**
```javascript
import { runtime } from 'webdetta/common/environment';

console.log(runtime);
// Output: 'browser' (or 'node', 'webworker', 'jsdom', 'deno', 'bun', undefined)

if (runtime === 'browser') {
  // Browser-specific code
} else if (runtime === 'node') {
  // Node.js-specific code
}
```

</details>

<details>
<summary><strong>isMobile</strong></summary>

Detects if the current device is a mobile device by checking the user agent string.

**Returns:**
- `boolean`: `true` if device is mobile, `false` otherwise

**Examples:**
```javascript
import { isMobile } from 'webdetta/common/environment';

if (isMobile) {
  console.log('Running on mobile device');
  // Output: 'Running on mobile device' (if mobile)
} else {
  console.log('Running on desktop');
  // Output: 'Running on desktop' (if desktop)
}

const viewport = isMobile ? 'mobile' : 'desktop';
// viewport: 'mobile' or 'desktop'
```

</details>

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

### `webdetta/common/object`

Object manipulation and utility functions. Provides type checking, property access, deep iteration, mapping, and picking operations for objects and arrays.

<details>
<summary><strong>isObject(value)</strong></summary>

Checks if a value is an object (not null and not a primitive).

**Parameters:**
- `value` (any): The value to check

**Returns:**
- `boolean`: `true` if value is an object, `false` otherwise

**Examples:**
```javascript
import { isObject } from 'webdetta/common/object';

isObject({}); // true
isObject([]); // true
isObject(new Date()); // true
isObject(null); // false
isObject(undefined); // false
isObject('string'); // false
isObject(42); // false
isObject(true); // false
isObject(() => {}); // true
```

</details>

<details>
<summary><strong>isPlainObject(value)</strong></summary>

Checks if a value is a plain object (object literal, not a class instance or built-in object).

**Parameters:**
- `value` (any): The value to check

**Returns:**
- `boolean`: `true` if value is a plain object, `false` otherwise

**Examples:**
```javascript
import { isPlainObject } from 'webdetta/common/object';

isPlainObject({}); // true
isPlainObject({ a: 1, b: 2 }); // true
isPlainObject(new Date()); // false
isPlainObject([]); // false
isPlainObject(null); // false
isPlainObject(new Object()); // true
isPlainObject(Object.create(null)); // false
```

</details>

<details>
<summary><strong>objectHasOwn(obj, key)</strong></summary>

Safely checks if an object has its own property (not inherited from prototype).

**Parameters:**
- `obj` (object): The object to check
- `key` (string | symbol): The property key to check

**Returns:**
- `boolean`: `true` if object has own property, `false` otherwise

**Examples:**
```javascript
import { objectHasOwn } from 'webdetta/common/object';

const obj = { a: 1 };
objectHasOwn(obj, 'a'); // true
objectHasOwn(obj, 'toString'); // false
objectHasOwn(obj, 'b'); // false

const obj2 = Object.create(null);
obj2.x = 1;
objectHasOwn(obj2, 'x'); // true
```

</details>

<details>
<summary><strong>objectEntriesDeep(obj)</strong></summary>

Generator function that iterates over all nested object properties, yielding `[keys, value]` pairs.

**Parameters:**
- `obj` (object): The object to iterate over

**Returns:**
- `Generator<[string[], any]>`: Generator yielding `[keys, value]` pairs

**Examples:**
```javascript
import { objectEntriesDeep } from 'webdetta/common/object';

const obj = {
  a: 1,
  b: {
    c: 2,
    d: {
      e: 3
    }
  }
};

for (const [keys, value] of objectEntriesDeep(obj)) {
  console.log(keys, value);
}
// Console output:
// ['a'] 1
// ['b', 'c'] 2
// ['b', 'd', 'e'] 3

const entries = Array.from(objectEntriesDeep(obj));
// entries: [ [['a'], 1], [['b', 'c'], 2], [['b', 'd', 'e'], 3] ]
```

</details>

<details>
<summary><strong>objectMap(obj, func)</strong></summary>

Maps over object properties, applying a function to each value.

**Parameters:**
- `obj` (object | array): The object or array to map over
- `func` (Function): Mapping function receiving `(value, key, obj)`

**Returns:**
- `object | array`: New object/array with mapped values

**Examples:**
```javascript
import { objectMap } from 'webdetta/common/object';

objectMap({ a: 1, b: 2, c: 3 }, (val) => val * 2);
// Returns: { a: 2, b: 4, c: 6 }

objectMap({ a: 1, b: 2 }, (val, key) => `${key}:${val}`);
// Returns: { a: 'a:1', b: 'b:2' }

objectMap([1, 2, 3], (val) => val * 2);
// Returns: [2, 4, 6]
```

</details>

<details>
<summary><strong>objectMapper(func)</strong></summary>

Creates a reusable mapper function that applies a transformation function to objects.

**Parameters:**
- `func` (Function): The mapping function

**Returns:**
- `Function`: Mapper function that takes an object and returns mapped object

**Examples:**
```javascript
import { objectMapper } from 'webdetta/common/object';

const double = objectMapper((val) => val * 2);
double({ a: 1, b: 2 });
// Returns: { a: 2, b: 4 }

const toString = objectMapper((val) => String(val));
toString({ a: 1, b: true });
// Returns: { a: '1', b: 'true' }
```

</details>

<details>
<summary><strong>objectMapDeep(obj, func)</strong></summary>

Recursively maps over nested objects, applying a function to all values.

**Parameters:**
- `obj` (object | array): The object to map over
- `func` (Function): Mapping function receiving `(value, keys, root)`

**Returns:**
- `object | array`: New object/array with all values mapped

**Examples:**
```javascript
import { objectMapDeep } from 'webdetta/common/object';

objectMapDeep({ a: 1, b: { c: 2 } }, (val) => val * 2);
// Returns: { a: 2, b: { c: 4 } }

objectMapDeep(
  { a: 1, b: { c: 2 } },
  (val, keys) => `${keys.join('.')}:${val}`
);
// Returns: { a: 'a:1', b: { c: 'b.c:2' } }
```

</details>

<details>
<summary><strong>objectMapperDeep(func)</strong></summary>

Creates a reusable deep mapper function that applies a transformation to nested objects.

**Parameters:**
- `func` (Function): The deep mapping function

**Returns:**
- `Function`: Deep mapper function

**Examples:**
```javascript
import { objectMapperDeep } from 'webdetta/common/object';

const doubleDeep = objectMapperDeep((val) => val * 2);
doubleDeep({ a: 1, b: { c: 2 } });
// Returns: { a: 2, b: { c: 4 } }

const stringifyDeep = objectMapperDeep((val) => String(val));
stringifyDeep({ a: 1, b: { c: true } });
// Returns: { a: '1', b: { c: 'true' } }
```

</details>

<details>
<summary><strong>objectPick(obj, keys)</strong></summary>

Creates a new object containing only the specified keys from the source object.

**Parameters:**
- `obj` (object): The source object
- `keys` (array): Array of keys to pick from the object

**Returns:**
- `object`: New object with only the picked keys

**Examples:**
```javascript
import { objectPick } from 'webdetta/common/object';

const obj = { a: 1, b: 2, c: 3, d: 4 };

objectPick(obj, ['a', 'c']);
// Returns: { a: 1, c: 3 }

objectPick(obj, ['b']);
// Returns: { b: 2 }

objectPick(obj, ['a', 'x']);
// Returns: { a: 1, x: undefined }
```

</details>

<details>
<summary><strong>objectPicker(keys)</strong></summary>

Creates a reusable picker function that extracts specific keys from objects.

**Parameters:**
- `keys` (array): Array of keys to pick

**Returns:**
- `Function`: Picker function that takes an object and returns picked object

**Examples:**
```javascript
import { objectPicker } from 'webdetta/common/object';

const pickAC = objectPicker(['a', 'c']);
pickAC({ a: 1, b: 2, c: 3 });
// Returns: { a: 1, c: 3 }

const pickNameEmail = objectPicker(['name', 'email']);
const users = [
  { name: 'John', email: 'john@example.com', age: 30 },
  { name: 'Jane', email: 'jane@example.com', age: 25 }
];
users.map(pickNameEmail);
// Returns: [
//   { name: 'John', email: 'john@example.com' },
//   { name: 'Jane', email: 'jane@example.com' }
// ]
```

</details>
