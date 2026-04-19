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
