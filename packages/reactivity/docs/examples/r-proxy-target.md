### `r.proxy(target)`

```javascript
const state = { x: 1, y: 2 };
const { x, y } = r.proxy(state);

r.effect(() => console.log('x:', x())); // individual signal
r.effect(() => console.log('y:', y())); // individual signal

x(10);
console.log(state.x); // 10
```

```javascript
const obj = r.val({ name: 'John', age: 30 });
const { name, age } = r.proxy(() => obj());

r.effect(() => console.log('name:', name()));
r.effect(() => console.log('age:', age()));

name('Jane');
age(35);
obj({ name: 'Alice', age: 40 });
```
