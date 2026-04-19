# realdom adapter

```javascript
import { el } from 'webdetta/realdom';
import realdomAdapter from 'webdetta/realcss/realdom-adapter';
import { Methods } from 'webdetta/realcss/default-methods';

const { methods } = Methods({ unit: [1, 'rem'] });
const { v } = realdomAdapter({ methods });

const button = el.Button(v.row('c', 'c').gap(1).bgc('black'), 'Save');
document.body.append(button);
```
