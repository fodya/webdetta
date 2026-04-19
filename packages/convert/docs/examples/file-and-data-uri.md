# File and Data URI

```javascript
import { bytesToFile, fileToDatauri, datauriToFile } from 'webdetta/convert';

const source = bytesToFile(new Uint8Array([72, 105]), 'hi.txt', { type: 'text/plain' });
const datauri = await fileToDatauri(source);
const restored = await datauriToFile(datauri, 'restored.txt');

console.log(restored.name); // 'restored.txt'
```
