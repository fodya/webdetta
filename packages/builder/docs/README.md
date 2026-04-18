# Builder

Implements expressive, chainable DSL syntax using the [builder pattern](https://en.wikipedia.org/wiki/Builder_pattern).

## Usage

### Basic Example

```javascript
import { Builder } from 'webdetta/builder';

// Create a builder with an effect function
const query = Builder((symbol, tasks, ...args) => {
  // When launched, tasks contains all chained method calls
  let sql = 'SELECT * FROM users';
  const conditions = [];
  
  for (const { names, args } of tasks) {
    if (names[0] === 'where') {
      conditions.push(args[0]);
    } else if (names[0] === 'limit') {
      sql += ` LIMIT ${args[0]}`;
    }
  }
  
  if (conditions.length) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  
  return sql;
});

// Chainable syntax
const sql = Builder.launch(
  query.where('age > 18').where('active = true').limit(10)
);
// Returns: "SELECT * FROM users WHERE age > 18 AND active = true LIMIT 10"
```

### DOM Operator Example (Real-world usage)

```javascript
import { Builder } from 'webdetta/builder';

// Create an operator for DOM manipulation
const attr = Builder((symbol, tasks, node) => {
  for (const { names, args } of tasks) {
    const attrName = names[0]; // e.g., 'id', 'class', 'data-value'
    const value = args[0];
    node.setAttribute(attrName, value);
  }
});

// Usage
const element = document.createElement('div');
Builder.launch(attr.id('myId').class('container').dataValue('123'), element);
// Sets: id="myId" class="container" data-value="123"
```

### Style Operator Example

```javascript
import { Builder } from 'webdetta/builder';

const style = Builder((symbol, tasks, node) => {
  for (const { names, args } of tasks) {
    const prop = names[0]; // e.g., 'color', 'fontSize'
    const value = args[0];
    node.style[prop] = value;
  }
});

const element = document.createElement('div');
Builder.launch(
  style.color('red').fontSize('16px').backgroundColor('white'),
  element
);
// Applies: color: red; font-size: 16px; background-color: white;
```

### Event Handler Builder

```javascript
import { Builder } from 'webdetta/builder';

const on = Builder((symbol, tasks, node) => {
  for (const { names, args } of tasks) {
    const eventName = names[0]; // e.g., 'click', 'mouseenter'
    const handler = args[0];
    node.addEventListener(eventName, handler);
  }
});

const button = document.createElement('button');
Builder.launch(
  on.click(() => console.log('Clicked'))
    .mouseenter(() => console.log('Hovered')),
  button
);
```

### Nested Property Access

```javascript
import { Builder } from 'webdetta/builder';

const config = Builder((symbol, tasks) => {
  const result = {};
  for (const { names, args } of tasks) {
    // names is an array: ['database', 'host'] for config.database.host('localhost')
    let current = result;
    for (let i = 0; i < names.length - 1; i++) {
      if (!current[names[i]]) current[names[i]] = {};
      current = current[names[i]];
    }
    current[names[names.length - 1]] = args[0];
  }
  return result;
});

const cfg = Builder.launch(
  config.database.host('localhost')
    .database.port(5432)
    .database.name('mydb')
    .api.url('https://api.example.com')
    .api.timeout(5000)
);
// Returns: {
//   database: { host: 'localhost', port: 5432, name: 'mydb' },
//   api: { url: 'https://api.example.com', timeout: 5000 }
// }
```

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

