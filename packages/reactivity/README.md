# webdetta/reactivity

Signals and effects for building reactive applications.

## Overview

- Signals (reactive values) that automatically trigger effects (reactive computations) when changed
- Automatic dependency tracking
- Lifecycle management

## Installation

```sh
npm i webdetta
```

```javascript
import { r } from 'webdetta/reactivity';
```

## Signals

Signals are reactive values that can be read and written.\
When a signal's value changes, all dependent effects are automatically re-run.

### `r.val(initialValue)`

Creates a signal with an initial value.\
Reading the signal (calling with no arguments) returns the current value.\
Writing (calling with a value) updates it and triggers dependent effects.

```javascript
const value = r.val(0);
value();        // read: returns 0
value(5);       // write: sets to 5, returns 5
value();        // read: returns 5
```

### `r.dval(initialValue)`

Creates a diff-based signal that only triggers effects when the value actually changes (uses strict equality).

```javascript
const value = r.dval(0);
value(0);       // No effect triggered (same value)
value(1);       // Effect triggered (value changed)
value(1);       // No effect triggered (same value)
```

## Effects

Effects are functions that automatically re-run when their dependent signals change.

### `r.effect(func)`

Creates a reactive effect that runs immediately and re-runs whenever any accessed signals change.

```javascript
const val = r.val(0);
r.effect(() => {
  console.log('Value:', val());
});
val(1);  // Automatically logs "Value: 1"
val(2);  // Automatically logs "Value: 2"
```

### `r.detach(func)`

Disables reactivity for the duration of `func`, even if called within a running `r.effect`.\
This is an **opt-out mechanism**: `r.detach` allows you to read signal values in `func` without subscribing to updates.\
No automatic re-runs will be scheduled when dependencies change.

```javascript
const a = r.val(2);
const b = r.val(3);

r.effect(() => {
  const aVal = a();

  // Reads inside r.detach aren't tracked.
  const result = r.detach(() => aVal * b());

  console.log('Result:', result);
});

a(4); // Triggers effect re-run
b(5); // Does not trigger effect re-run even though b() is used in calculations
```

### `r.scope(func)`

Creates an **effect scope**. Returns an object with an `abort()` method.

```javascript
const scope = r.scope(() => {
  // All effects and nested scopes created here are controlled by the scope.
  r.effect(() => { /* ... */ });
  r.scope(() => { /* ... */ });
  console.log('Running...');
});
scope.abort();
```

Calling `scope.abort()` will:
1. Stop all `r.effect` handlers created in this scope, so they will never be called again when signals change.
2. Abort all nested `r.scope` instances created inside this scope, stopping everything within them as well.

This effectively ends the lifecycle of the scope, along with all its inner effects and nested scopes.

This is useful when removing reactive UI elements from webpage or resetting application state.

## Derived Values

### `r.memo(func)`

> An optimization to avoid recomputing expensive calculations.

```javascript
const a = r.val(314159265);
const b = r.val(271828182);

function gcd(x, y) {
  while (y) [x, y] = [y, x % y];
  return x;
}

// We optimize this computation using r.memo 
// Now, gcd(a(), b()) runs ONLY when a or b update – not on every effect run.
const result = r.memo(() => {
  console.log('GCD computation executed');
  return gcd(a(), b());
});
const other = r.val(0);
r.effect(() => {
  // No matter how many times this effect runs, the value will be recalculated only when a() or b() change.
  console.log('GCD:', result(), '|', 'Other dependency:', other());
});
for (let i = 0; i < 10; i++) other(i); // does not trigger gcd() computation
b(1000000000); // triggers gcd() call
```

### `r.await(func)`

Creates a signal that tracks async operations. The signal updates when the returned promise resolves.

#### Important: async functions aren't supported

The `func` must be a **synchronous** function that returns a promise.

Tracking signals/effects inside an async function is not fully possible because AsyncContext is not yet supported in browsers.

#### [✓] Intended usage: synchronous function returning a Promise

```javascript
const url = r.val('/api/data');
const data = r.await(() => {
  const currentUrl = url(); // The url() dependency is captured correctly
  return fetch(currentUrl).then(r => r.json()); // Promise
});
r.effect(() => {
  console.log('Data:', data()); // Prints the resolved value or undefined if still loading
});
url('/other-url') // Calling url() will cause data() to be recalculated
```

#### [x] Incorrect usage: async function

```javascript
const url = r.val('/api/data');
const data = r.await(async () => {
  // Context is lost inside async function
  const currentUrl = url(); // The url() dependency isn't captured
  return await fetch(currentUrl).then(r => r.json());
});
// Updating url() will not trigger re-runs
url('/new-url') // Has no-effect on data()
```

### `r.proxy(target)`

Creates a reactive proxy that provides signal-like access to object properties.\
Each proxied property is individually reactive; updates trigger only the relevant effects.

#### Proxying a plain object

```javascript
const state = { x: 1, y: 2 };
const { x, y } = r.proxy(state);

r.effect(() => console.log('x:', x())); // x: 1
r.effect(() => console.log('y:', y())); // y: 2

x(10); // sets state.x = 10; runs the 1st effect; prints "x: 10"
```


#### Proxying a reactive object

```javascript
const obj = r.val({ name: 'John', age: 30 });
const { name, age } = r.proxy(() => obj());

r.effect(() => console.log('name:', name())); // name: John
r.effect(() => console.log('age:', age()));   // age: 30

name('Jane'); // runs the 1st effect; prints "name: Jane"
age(35);      // runs the 2nd effect; prints "age: 35"

obj({ name: 'Alice', age: 40 }); // runs both effects; prints "name: Alice", then "age: 40"
```

## Key Concepts

### Fully Synchronous Effects

All effects in Webdetta's reactivity system are **fully synchronous**. This means that whenever a signal's value is set, all effects that depend on that signal will run synchronously in the same call stack. No promises, microtasks, or event-loop deferrals are involved in effect propagation.

- There is no batching via `Promise.resolve().then(...)`; updates run instantly and predictably.
- This makes dataflow and timing easy to reason about, since every change is processed before moving on.

**Example: Chained synchronous updates**

```javascript
const a = r.val(1);
const b = r.val(2);

r.effect(() => {
  // This runs immediately when a or b changes
  console.log('sum:', a() + b());
});

// All updates and effects are synchronous:
a(10);           // Console: "sum: 12"
b(5);            // Console: "sum: 15"
console.log('done');  // "done" is logged after the effects run
```

**Example: Synchronous updates, always finished before continuation**

```javascript
const state = r.val(0);

r.effect(() => {
  console.log('Effect sees:', state());
});

console.log('--- Set state ---');
state(42);
// The effect runs to completion *before* this line:
console.log('After set');
// Output:
// --- Set state ---
// Effect sees: 42
// After set
```

### Deferred Side-effects

Side-effect calls are postponed until the current `effect` completes.\
This prevents intermediate state from propagating to other `effect`s, ensuring that dependent computations are executed with a consistent, finished state.

**Example:**

```javascript
const val = r.val(0);
r.effect(function handler1() {
  if (val() == 0) { val(1); val(2); val(3); }
});

// Prints only "3", skipping intermediate values "1" and "2"
r.effect(function handler2() {
  console.log(val());
});
```

### Lifecycle of an Effect

An effect will only remain subscribed to signals that it reads.\
If it returns early or throws before reading any signal, it will be unsubscribed and stop reacting to changes.

**Example:**

```javascript
const val = r.val(0);
let stop = false;
r.effect(function handler() {
  if (stop) return;
  console.log('Current value:', val());
});

val(1);     // Prints "Current value: 1"
stop = true;
val(2);     // No console log (effect handler returned early, unsubscribed automatically)
stop = false;
val(3);     // No console log (effect handler is no longer subscribed to this signal)
```

In summary, effects can be stopped in 2 ways:
1. Manually, by using the scope.abort()
2. Automatically, by returning early or not reading any signals

A stopped effect will not receive futher signal updates.

## API Reference

### Signals

- **`r.val(initialValue)`** - Create a reactive signal
- **`r.dval(initialValue)`** - Create a diff-based reactive signal

### Effects

- **`r.effect(func)`** - Create a reactive effect
- **`r.detach(func)`** - Opt-out of reactivity, detach from reactive updates
- **`r.scope(func)`** - Create an abortable scope

### Derived

- **`r.memo(func)`** - Memoize reactive computation based on dependencies
- **`r.await(func)`** - Create a signal from a function that returns a promise
- **`r.proxy(target)`** - Create a reactive proxy for object properties
