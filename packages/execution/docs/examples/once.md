# once()

```javascript
import { once } from 'webdetta/execution';

const init = once(() => console.log('init'));

init();
init();
console.log(init.isLocked()); // true
```
