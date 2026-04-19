# Text and Base64

```javascript
import { textToBase64, base64ToText } from 'webdetta/convert';

const encoded = textToBase64('hello');
console.log(encoded); // 'aGVsbG8='
console.log(base64ToText(encoded)); // 'hello'
```
