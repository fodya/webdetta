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
