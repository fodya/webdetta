# File and JSON

```javascript
import { jsonToFile, fileToJson } from 'webdetta/convert';

const file = await jsonToFile({
  name: 'data.json',
  mimeType: 'application/json',
  content: { count: 3 },
});

console.log(await fileToJson(file)); // { count: 3 }
```
