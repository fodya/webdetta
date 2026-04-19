# FormData and JSON

```javascript
import { jsonToFormdata, formdataToJson } from 'webdetta/convert';

const form = jsonToFormdata({
  name: 'webdetta',
  tags: ['js', 'deno'],
});

console.log(form.get('name')); // 'webdetta'
console.log(formdataToJson(form));
```
