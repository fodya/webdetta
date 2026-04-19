### `r.effect(func)`

```javascript
const val = r.val(0);
r.effect(() => {
  console.log('Value:', val());
});
val(1);  // logs "Value: 1"
val(2);  // logs "Value: 2"
```

## Effect cleanup

```javascript
import { r } from 'webdetta/reactivity';

r.effect(() => {
  const id = setInterval(() => {}, 1000);
  return () => clearInterval(id);
});
```
