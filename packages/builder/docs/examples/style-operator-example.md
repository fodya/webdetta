### Style Operator Example

```javascript
import { Builder } from 'webdetta/builder';

const style = Builder((symbol, tasks, node) => {
  for (const { names, args } of tasks) {
    const prop = names[0]; // e.g., 'color', 'fontSize'
    const value = args[0];
    node.style[prop] = value;
  }
});

const element = document.createElement('div');
Builder.launch(
  style.color('red').fontSize('16px').backgroundColor('white'),
  element
);
// Applies: color: red; font-size: 16px; background-color: white;
```
