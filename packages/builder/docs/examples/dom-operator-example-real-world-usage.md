### DOM Operator Example (Real-world usage)

```javascript
import { Builder } from 'webdetta/builder';

// Create an operator for DOM manipulation
const attr = Builder((symbol, tasks, node) => {
  for (const { names, args } of tasks) {
    const attrName = names[0]; // e.g., 'id', 'class', 'data-value'
    const value = args[0];
    node.setAttribute(attrName, value);
  }
});

// Usage
const element = document.createElement('div');
Builder.launch(attr.id('myId').class('container').dataValue('123'), element);
// Sets: id="myId" class="container" data-value="123"
```
