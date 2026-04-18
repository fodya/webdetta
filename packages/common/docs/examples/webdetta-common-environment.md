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
