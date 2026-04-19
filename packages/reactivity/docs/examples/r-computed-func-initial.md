### `r.computed(func, { initial }?)`

```javascript
const a = r.val(2);
const b = r.val(3);
const sum = r.computed(() => a() + b());

sum(); // 5
```
