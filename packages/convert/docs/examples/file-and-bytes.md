# File and Bytes

```javascript
import { bytesToFile, fileToBytes } from 'webdetta/convert';

const file = bytesToFile(new Uint8Array([72, 73]), 'hi.txt', { type: 'text/plain' });
const bytes = await fileToBytes(file);

console.log(new TextDecoder().decode(bytes)); // 'HI'
```
