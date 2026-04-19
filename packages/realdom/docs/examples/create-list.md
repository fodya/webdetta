# createList()

```javascript
import { el } from 'webdetta/realdom';
import { createList } from 'webdetta/realdom/dynamic';
import { r } from 'webdetta/reactivity';

const items = r.val(['a', 'b']);
const list = el.Ul(createList(items, (item) => el.Li(item)));

document.body.append(list);
items(['a', 'b', 'c']);
```
