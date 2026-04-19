# createIf()

```javascript
import { el } from 'webdetta/realdom';
import { createIf } from 'webdetta/realdom/dynamic';
import { r } from 'webdetta/reactivity';

const loading = r.val(true);
const view = createIf()
  .elif(loading, el.Span('Loading...'))
  .else(el.Strong('Done'));

document.body.append(el.Div(view));
loading(false);
```
