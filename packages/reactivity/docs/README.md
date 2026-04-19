# webdetta/reactivity

## Installation

```sh
npm i webdetta
```

```javascript
import { r } from 'webdetta/reactivity';
```

## Signals

### `r.val(initialValue?)`

```javascript
const value = r.val(0);
value();        // read: 0
value(5);       // write: 5, returns 5
value();        // read: 5
```

### `r.dval(initialValue?)`

```javascript
const value = r.dval(0);
value(0);       // no run (same value)
value(1);       // dependents run
value(1);       // no run
```

```javascript
const state = r.dval({ count: 0 });
const ref = state();

state(ref);            // no run (same object reference)
state({ count: 0 });   // dependents run (different object reference)
```

## Effects

### `r.effect(func)`

```javascript
const val = r.val(0);
r.effect(() => {
  console.log('Value:', val());
});
val(1);  // logs "Value: 1"
val(2);  // logs "Value: 2"
```

### Effect cleanup (return from handler)

```javascript
r.effect(() => {
  const id = setInterval(() => {}, 1000);
  return () => clearInterval(id);
});
```

## Computed values

### `r.computed(func, { initial }?)`

```javascript
const a = r.val(2);
const b = r.val(3);
const sum = r.computed(() => a() + b());

sum(); // 5
```

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
