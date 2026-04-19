# Element.append()

```javascript
import { Element } from 'webdetta/realdom/base';

const root = document.createElement('div');
Element.append(root, ['hello ', document.createElement('span')]);

document.body.append(root);
```
