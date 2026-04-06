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

### `r.untrack(func)`

```javascript
const a = r.val(2);
const b = r.val(3);

r.effect(() => {
  const aVal = a();
  r.untrack(() => {
    const result = aVal * b();
    console.log('Result:', result);
  });
});

a(4); // run outer effect
b(5); // does not run outer effect (b was only read inside untrack)
```

### `r.cleanup(handler)`

```javascript
r.effect(() => {
  const id = setInterval(() => {}, 1000);
  r.cleanup(() => clearInterval(id));
});
```

## Computed values

### `r.computed(func, { type, initial, resolvePromises }?)`

```javascript
const a = r.val(2);
const b = r.val(3);
const sum = r.computed(() => a() + b());

sum(); // 5
```

```javascript
const source = r.val(1);
const doubled = r.computed(
  () => source() * 2,
  { type: r.dval, initial: 0 }, // custom signal type
);
```

```javascript
const url = r.val('/api/data');
const data = r.computed(() => {
  const currentUrl = url();
  return fetch(currentUrl).then(r => r.json()); // resolves Promise by default
});

r.effect(() => {
  console.log(data()); // parsed response after Promise resolves
});
```

```javascript
const source = r.val(1);
const promise = r.computed(
  () => Promise.resolve(source() * 3),
  { resolvePromises: false }, // store Promise as-is
);

r.effect(() => {
  console.log(promise()); // Promise { 3 }
});
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
