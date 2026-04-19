### Event Handler Builder

```javascript
import { Builder } from 'webdetta/builder';

const on = Builder((symbol, tasks, node) => {
  for (const { names, args } of tasks) {
    const eventName = names[0]; // e.g., 'click', 'mouseenter'
    const handler = args[0];
    node.addEventListener(eventName, handler);
  }
});

const button = document.createElement('button');
Builder.launch(
  on.click(() => console.log('Clicked'))
    .mouseenter(() => console.log('Hovered')),
  button
);
```
