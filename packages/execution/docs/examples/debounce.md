# debounce()

```javascript
import { debounce } from 'webdetta/execution';

const search = debounce(200, (query) => query.toUpperCase());

search('a').catch(() => {});
const result = await search('ab');
console.log(result); // 'AB'
```
