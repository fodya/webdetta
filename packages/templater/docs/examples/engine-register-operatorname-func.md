# engine.register(operatorName, func)

<summary><strong>engine.register(operatorName, func)</strong></summary>

Registers a custom operator function that processes template expressions. **Operators must be registered before they can be used in templates.** The engine does nothing by default—it's intended that all operators be implemented by you.

**Parameters:**
- `operatorName` (string): Operator name (empty string for default operator, commonly used as a getter)
- `func` (Function): Handler function receiving `(ctx, args, render)`
  - `ctx` (object): Flattened context object
  - `args` (array): Array of arguments from the template
  - `render` (Function): Function to render nested expressions

**Returns:**
- `void`: Registers the operator

**Note:** If you try to use an unregistered operator, the engine will throw an error: `Unknown operator: <operatorName>`

**Examples:**
```javascript
import { Templater } from 'webdetta/templater';

const engine = Templater({ operatorSymbol: '$', openBracket: '{', closeBracket: '}', argumentsSeparator: ',' });

// Register getter (empty operatorName)
engine.register('', (ctx, args) => {
  const key = args[0].trim();
  return ctx[key];
});

// Register length operator
engine.register('length', (ctx, args, render) => {
  const key = args[0].trim();
  return ctx[key].length;
});

// Register conditional operator
engine.register('if', (ctx, args, render) => {
  const key = args[0].trim();
  const content = args.slice(1);
  if (ctx[key]) return render(content, ctx);
  return '';
});

// Usage examples
const result1 = engine.render('Hello ${name}', { name: 'World' });
// Returns: 'Hello World'

const result2 = engine.render('Items count: $length{items}', { items: ['a', 'b', 'c'] });
// Returns: 'Items count: 3'

const result3 = engine.render('$if{show, Welcome ${user}!}', {
  show: true,
  user: 'Alice'
});
// Returns: 'Welcome Alice!'

const result4 = engine.render('$if{show, Welcome ${user}!}', {
  show: false,
  user: 'Alice'
});
// Returns: '' (empty string)
```

</details>
