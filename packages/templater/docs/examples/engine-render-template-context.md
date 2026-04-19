# engine.render(template, context)

<summary><strong>engine.render(template, context)</strong></summary>

Renders a template string with the provided context. **All operators used in the template must be registered first** using `engine.register()`. The engine will throw an error if an unregistered operator is encountered.

**Parameters:**
- `template` (string): Template string with expressions
- `context` (object): Context object with variables and data

**Returns:**
- `string`: Rendered template string

**Throws:**
- `Error`: If an unregistered operator is used in the template

**Examples:**
```javascript
import { Templater } from 'webdetta/templater';

const engine = Templater({ operatorSymbol: '$', openBracket: '{', closeBracket: '}', argumentsSeparator: ',' });

// Register getter
engine.register('', (ctx, args) => ctx[args[0].trim()]);

// Simple getter usage
const result = engine.render('Hello ${name}', { name: 'World' });
// Returns: 'Hello World'

// Multiple getters
const result2 = engine.render('${greeting} ${name}!', {
  greeting: 'Hello',
  name: 'Alice'
});
// Returns: 'Hello Alice!'
```

</details>
