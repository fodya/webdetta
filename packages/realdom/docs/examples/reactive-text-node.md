# Reactive Text Node

```javascript
import { el } from 'webdetta/realdom';
import { r } from 'webdetta/reactivity';

const count = r.val(0);
const node = el.Div(() => `count: ${count()}`);

document.body.append(node);
count(1);
```
