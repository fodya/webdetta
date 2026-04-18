### `r.store(target)`

```javascript
const state = { x: 1, y: 2 };
const store = r.store(state);

r.effect(() => console.log('x:', store.x)); // per-property tracking

store.x = 10;
console.log(state.x); // 10
```

```javascript
const store = r.store({ list: [1, 2] });

r.effect(() => console.log(store.list.length));

store.list.push(3);                // effect doesn't run
store.list = store.list.concat(4); // runs effect
```
