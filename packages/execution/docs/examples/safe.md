# safe()

```javascript
import { safe } from 'webdetta/execution';

const parse = safe(JSON.parse, (error) => {
  console.error('parse failed:', error.message);
});

parse('{"ok":true}');
parse('{broken json}');
```
