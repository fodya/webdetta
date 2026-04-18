# Operator()

```javascript
import { Element, Operator } from 'webdetta/realdom/base';

const attr = Operator((node, names, args) => {
  node.setAttribute(names[0], args[0]);
});

const node = document.createElement('div');
Element.append(node, attr.id('hero'));
```
