# webdetta/reactivity

Signals and effects for building reactive applications.

## Overview

1. Signals (reactive values) that re-run dependent effects when they change.
1. Automatic dependency tracking for reads inside `r.effect`.
1. `Effect` instances you can `destroy()`; `r.cleanup` for per-run teardown.

## Installation

```sh
npm i webdetta
```

```javascript
import { r } from 'webdetta/reactivity';
```

The public surface is the **`r`** object (frozen). There is no separate `r.scope` export in the current implementation.

## Signals

Signals are accessors: call with no arguments to read, with one argument to write. Writes notify dependents.

### `r.val(initialValue?)`

Creates a signal. Every write runs dependent effects (subject to deferred flushing when a write happens inside another effect—see **Deferred side-effects**).

```javascript
const value = r.val(0);
value();        // read: 0
value(5);       // write: 5, returns 5
value();        // read: 5
```

### `r.dval(initialValue?)`

Like `r.val`, but dependents run only when the new value is `!==` the previous one.
There is no custom comparator hook in the current implementation, so objects are compared by reference.

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

Creates a **reactive** effect: `func` runs immediately, then again when signals read inside `func` change. Returns the `Effect` instance (`destroy()`, etc.).

```javascript
const val = r.val(0);
r.effect(() => {
  console.log('Value:', val());
});
val(1);  // logs "Value: 1"
val(2);  // logs "Value: 2"
```

### `r.untrack(func)`

Runs `func` in a **non-reactive** effect: signal reads inside `func` do not subscribe the surrounding `r.effect`. Returns the non-reactive `Effect` after `func` has run synchronously; the handler’s return value is not used by `r.untrack`.

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

a(4); // re-runs outer effect
b(5); // does not re-run outer effect (b was only read inside untrack)
```

### `r.cleanup(handler)`

Registers `handler` on the **current** effect’s cleanup list. It runs before that effect’s next execution (after `cleanup()` clears the previous run) and from `Effect.destroy()`. Call **only** synchronously while a `r.effect` / `r.untrack` body is active (`currentEffect`).

```javascript
r.effect(() => {
  const id = setInterval(() => {}, 1000);
  r.cleanup(() => clearInterval(id));
});
```

## Derived values

### `r.memo(func)`

Caches the result of `func` in an inner signal; recomputes only when signals read **inside** `func` change.

```javascript
const a = r.val(314159265);
const b = r.val(271828182);

function gcd(x, y) {
  while (y) [x, y] = [y, x % y];
  return x;
}

const result = r.memo(() => {
  console.log('GCD computation executed');
  return gcd(a(), b());
});
const other = r.val(0);
r.effect(() => {
  console.log('GCD:', result(), '| other:', other());
});
for (let i = 0; i < 10; i++) other(i);
b(1000000000);
```

### `r.await(func)`

Exposes a signal whose value is updated when a **Promise** returned by `func` settles. Implementation uses `throttle.Td(0, …)` plus `Promise.resolve(…).then(…)`, so commits to the signal are **not** strictly same–call-stack synchronous.

`func` must be a **synchronous** function that **returns** a Promise (not an `async` function) so dependencies are read before any `await`.

```javascript
const url = r.val('/api/data');
const data = r.await(() => {
  const currentUrl = url();
  return fetch(currentUrl).then(r => r.json());
});
r.effect(() => {
  console.log('Data:', data());
});
url('/other-url');
```

Incorrect (async function loses tracking for `url()` after the first `await`):

```javascript
// const data = r.await(async () => {
//   const currentUrl = url();
//   return (await fetch(currentUrl)).json();
// });
```

### `r.proxy(target)`

`target` is either a plain object or `() => object`. Each property is a signal-like accessor; writes go through to the underlying object.

```javascript
const state = { x: 1, y: 2 };
const { x, y } = r.proxy(state);

r.effect(() => console.log('x:', x()));
r.effect(() => console.log('y:', y()));

x(10);
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

## Key concepts

### Synchronous core graph

When a signal updates **outside** an active effect, dependent effects run **synchronously** in the same stack (until `r.await`-style async flushes).

Inside an `Effect.run`, after your handler returns, the runtime runs any **deferred** subscriber runs queued in `sideEffects` for that same turn—still without yielding the event loop for that core flush.

### Deferred side-effects

If a signal `trigger()` fires **while** some `r.effect` body is running, the affected reactive effects are queued on the **current** effect’s `sideEffects` and run **after** that body finishes. That avoids observers seeing intermediate writes in the middle of the parent run.

```javascript
const val = r.val(0);
r.effect(function handler1() {
  if (val() == 0) { val(1); val(2); val(3); }
});

r.effect(function handler2() {
  console.log(val());
});
// Typically logs a single settled value (e.g. 3), not 1 then 2 then 3.
```

### Lifecycle

1. **Destroy** — call `effect.destroy()` on an `Effect` returned from `r.effect` or `r.untrack` to tear down that subtree (runs cleanups, destroys children, removes from parent).
1. **Unsubscribe** — a reactive effect stops tracking if it returns before reading any signal on a run (no automatic `destroy()`).

## API reference

### Signals

1. **`r.val(initialValue?)`** — reactive signal
1. **`r.dval(initialValue?)`** — diff signal (`===`)

### Effects

1. **`r.effect(func)`** — reactive effect; returns `Effect`
1. **`r.untrack(func)`** — non-reactive run; returns `Effect`
1. **`r.cleanup(handler)`** — register cleanup handler on current effect

### Derived

1. **`r.memo(func)`** — memoized signal
1. **`r.await(func)`** — signal driven by a Promise (sync `func` returning Promise)
1. **`r.proxy(target)`** — per-property accessors
