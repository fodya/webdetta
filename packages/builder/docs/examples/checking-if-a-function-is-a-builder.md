### Checking if a Function is a Builder

```javascript
import { Builder } from 'webdetta/builder';

const myBuilder = Builder((symbol, tasks) => { /* ... */ });

Builder.isBuilder(myBuilder); // true
Builder.isBuilder(() => {}); // false
```

## API

- `Builder(effect, tasks, names)` - Creates a new builder instance
  - `effect` - Function that processes tasks: `(symbol, tasks, ...args) => result`
  - `tasks` - Array of task objects: `{ names: string[], args: any[] }`
  - `names` - Array of property names accessed (internal)
  
- `Builder.isBuilder(f)` - Checks if a function is a builder
  - Returns `true` if the function was created with `Builder`
  
- `Builder.launch(f, ...args)` - Launches a builder with arguments
  - Calls the builder with `Builder.symbol` as first argument
  - Passes additional arguments to the effect function
  - Returns the result of the effect function

## How It Works

1. **Building**: When you call methods on a builder (e.g., `builder.method1().method2()`), it accumulates tasks without executing them.

2. **Task Structure**: Each task contains:
   - `names`: Array of property names accessed (e.g., `['attr', 'id']` for `builder.attr.id()`)
   - `args`: Arguments passed to the method call

3. **Launching**: `Builder.launch()` triggers execution by calling the builder with `Builder.symbol`, which causes the effect function to run with all accumulated tasks.

4. **Chainable**: Methods return new builder instances, allowing infinite chaining.
