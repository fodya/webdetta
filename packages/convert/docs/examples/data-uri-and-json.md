# Data URI and JSON

```javascript
import { jsonToDatauri, datauriToJson } from 'webdetta/convert';

const datauri = jsonToDatauri({
  mimeType: 'application/json',
  content: { ok: true },
});

console.log(await datauriToJson(datauri)); // { ok: true }
```
