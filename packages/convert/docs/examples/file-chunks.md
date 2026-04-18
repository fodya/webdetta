# File Chunks

```javascript
import { bytesToFile, fileToChunks, chunksToFile } from 'webdetta/convert';

const file = bytesToFile(new Uint8Array([1, 2, 3, 4]), 'data.bin');
const chunks = [];
for await (const chunk of fileToChunks(file, 2)) chunks.push(chunk);

const merged = await chunksToFile(chunks, 'copy.bin');
console.log(merged.size); // 4
```
