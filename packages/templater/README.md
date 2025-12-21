# Templater

Customizable template engine.

**Features:**
- Customizable syntax (operator symbol, brackets, argument separator)
- Expression parsing and rendering
- User-defined operators via `.register()`
- Errors are thrown for unregistered operators

The template engine does **not** perform sanitization or safety checks.\
Input strings must be trusted and verified before being passed to the template engine.


## Usage

```javascript
import { Templater } from 'webdetta/templater';

const engine = Templater({
  operatorSymbol: '$',
  openBracket: '{',
  closeBracket: '}',
  argumentsSeparator: ','
});
```

**Expression format:**
```
<operatorSymbol><operatorName><arguments><closeBracket>
```

**Expression example #1**:

Input:
```text
$test{a,b,c}
```

Parser settings: 
```js
{ operatorSymbol: "$", openBracket: "{", closeBracket: "}", argumentsSeparator: "," }
```

Parsed expression: 
```js
{ operatorName: "test", arguments: ["a", "b", "c"] }
```

---

**Expression example #2**:

Input:
```text
@[[foo|bar|baz]]
```

Parser settings: 
```js
{ operatorSymbol: "@", openBracket: "[[", closeBracket: "]]", argumentsSeparator: "|" }
```

Parsed expression: 
```js
{ operatorName: "", arguments: ["foo", "bar", "baz"] }
```

## API

<details>
<summary><strong>Templater({ operatorSymbol, openBracket, closeBracket, argumentsSeparator })</strong></summary>

Creates a new template engine instance with custom syntax configuration.

**Parameters:**
- `operatorSymbol` (string): The operator character that starts expressions (e.g., `'$'`, `'@'`)
- `openBracket` (string): The opening bracket character (e.g., `'{'`, `'('`)
- `closeBracket` (string): The closing bracket character (e.g., `'}'`, `')'`)
- `argumentsSeparator` (string): The separator character for arguments (e.g., `','`, `'|'`)

**Returns:**
- `object`: Template engine instance with `register` and `render` methods

**Examples:**
```javascript
import { Templater } from 'webdetta/templater';

// Default syntax: ${variable}
const engine = Templater({
  operatorSymbol: '$',
  openBracket: '{',
  closeBracket: '}',
  argumentsSeparator: ','
});

// Custom syntax: @variable(name)
const customEngine = Templater({
  operatorSymbol: '@',
  openBracket: '(',
  closeBracket: ')',
  argumentsSeparator: '|'
});
```

</details>

<details>
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

<details>
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

## Examples

<details>
<summary><strong>Empty Operator Name (Default Operator)</strong></summary>

When `<operatorName>` is empty, the expression acts as a default operator. This is commonly used as a getter to retrieve values from the context.

**Syntax:** `<operatorSymbol><openBracket><key><closeBracket>`

```javascript
import { Templater } from 'webdetta/templater';

const engine = Templater({
  operatorSymbol: '$',
  openBracket: '{',
  closeBracket: '}',
  argumentsSeparator: ','
});

// Register default operator (empty operatorName) as a getter
engine.register('', (ctx, args) => {
  const key = args[0].trim();
  return ctx[key];
});

// Simple getter
const result = engine.render('Name: ${name}', { name: 'John' });
// Returns: 'Name: John'

// Multiple getters
const result2 = engine.render('${firstName} ${lastName}', {
  firstName: 'Jane',
  lastName: 'Doe'
});
// Returns: 'Jane Doe'

// Getter with numbers
const result3 = engine.render('Price: $${price}', { price: 99.99 });
// Returns: 'Price: $99.99'
```

</details>

<details>
<summary><strong>Custom Operators</strong></summary>

Examples of custom operators you can implement: conditionals, loops, and utilities.

```javascript
import { Templater } from 'webdetta/templater';

const engine = Templater({
  operatorSymbol: '$',
  openBracket: '{',
  closeBracket: '}',
  argumentsSeparator: ','
});

// Register default operator (empty operatorName) as a getter
engine.register('', (ctx, args) => ctx[args[0].trim()]);

// Register 'if' operator - renders content conditionally based on a context value
engine.register('if', (ctx, args, render) => {
  const key = args[0].trim();
  const content = args.slice(1);
  if (ctx[key]) return render(content, ctx);
  return '';
});

// Register 'if_not' operator - renders content when a context value is falsy
engine.register('if_not', (ctx, args, render) => {
  const key = args[0].trim();
  const content = args.slice(1);
  if (!ctx[key]) return render(content, ctx);
  return '';
});

// Register 'if_eq' operator - renders content when a context value equals a specified string
engine.register('if_eq', (ctx, args, render) => {
  const key = args[0].trim();
  const val = args[1].trim();
  const content = args.slice(2);
  if (ctx[key] == val) return render(content, ctx);
  return '';
});

// Register 'for' operator - iterates over an array and renders content for each item
engine.register('for', (ctx, args, render) => {
  const itemVar = args[0].trim();
  const itemsKey = args[1].trim();
  const content = args.slice(2);
  return ctx[itemsKey].map(item => render(content, {
    ...ctx,
    [itemVar]: item
  })).join('');
});

// Register 'length' operator - returns the length of a context value
engine.register('length', (ctx, args) => {
  const key = args[0].trim();
  return ctx[key].length;
});

// Example: Conditional (if)
const result1 = engine.render('$if{loggedIn, Welcome back!}', {
  loggedIn: true
});
// Returns: 'Welcome back!'

const result2 = engine.render('$if{loggedIn, Welcome back!}', {
  loggedIn: false
});
// Returns: '' (empty string)

// Example: Conditional with nested getter
const result3 = engine.render('$if{show, Hello ${name}!}', {
  show: true,
  name: 'User'
});
// Returns: 'Hello User!'

// Example: Conditional (if_not)
const result4 = engine.render('$if_not{loggedIn, Please log in}', {
  loggedIn: false
});
// Returns: 'Please log in'

// Example: Equality Check (if_eq)
const result5 = engine.render('$if_eq{status,active, Status is active}', {
  status: 'active'
});
// Returns: 'Status is active'

const result6 = engine.render('$if_eq{role,admin, Admin: ${name}}', {
  role: 'admin',
  name: 'Alice'
});
// Returns: 'Admin: Alice'

// Example: Loop (for)
const result7 = engine.render('Items: $for{item,items, ${item}, }', {
  items: ['apple', 'banana', 'cherry']
});
// Returns: 'Items: apple, banana, cherry, '

const result8 = engine.render('$for{item,items, <li>${item}</li>}', {
  items: ['Item 1', 'Item 2', 'Item 3']
});
// Returns: '<li>Item 1</li><li>Item 2</li><li>Item 3</li>'

// Example: Length
const result9 = engine.render('Count: $length{items}', {
  items: ['a', 'b', 'c']
});
// Returns: 'Count: 3'

const result10 = engine.render('Length: $length{text}', {
  text: 'Hello World'
});
// Returns: 'Length: 11'
```

</details>

<details>
<summary><strong>Custom Operator Symbol</strong></summary>

Using different operator symbols.

```javascript
import { Templater } from 'webdetta/templater';

// Using @ symbol
const engine1 = Templater({
  operatorSymbol: '@',
  openBracket: '{',
  closeBracket: '}',
  argumentsSeparator: ','
});

engine1.register('', (ctx, args) => ctx[args[0].trim()]);

const result1 = engine1.render('Hello @{name}', { name: 'World' });
// Returns: 'Hello World'

// Using # symbol
const engine2 = Templater({
  operatorSymbol: '#',
  openBracket: '{',
  closeBracket: '}',
  argumentsSeparator: ','
});

engine2.register('', (ctx, args) => ctx[args[0].trim()]);

const result2 = engine2.render('Hello #{name}', { name: 'World' });
// Returns: 'Hello World'
```

</details>

<details>
<summary><strong>Custom Brackets</strong></summary>

Using different bracket styles.

```javascript
import { Templater } from 'webdetta/templater';

// Using parentheses
const engine1 = Templater({
  operatorSymbol: '$',
  openBracket: '(',
  closeBracket: ')',
  argumentsSeparator: ','
});

engine1.register('', (ctx, args) => ctx[args[0].trim()]);

const result1 = engine1.render('Hello $(name)', { name: 'World' });
// Returns: 'Hello World'

// Using square brackets
const engine2 = Templater({
  operatorSymbol: '$',
  openBracket: '[',
  closeBracket: ']',
  argumentsSeparator: ','
});

engine2.register('', (ctx, args) => ctx[args[0].trim()]);

const result2 = engine2.render('Hello $[name]', { name: 'World' });
// Returns: 'Hello World'
```

</details>

<details>
<summary><strong>Custom Arguments Separator</strong></summary>

Using different separators for arguments.

```javascript
import { Templater } from 'webdetta/templater';

// Using pipe separator
const engine1 = Templater({
  operatorSymbol: '$',
  openBracket: '{',
  closeBracket: '}',
  argumentsSeparator: '|'
});

engine1.register('', (ctx, args) => ctx[args[0].trim()]);
engine1.register('if', (ctx, args, render) => {
  const key = args[0].trim();
  const content = args.slice(1);
  if (ctx[key]) return render(content, ctx);
  return '';
});

const result1 = engine1.render('$if{show|Hello ${name}}', {
  show: true,
  name: 'World'
});
// Returns: 'Hello World'

// Using semicolon separator
const engine2 = Templater({
  operatorSymbol: '$',
  openBracket: '{',
  closeBracket: '}',
  argumentsSeparator: ';'
});

engine2.register('', (ctx, args) => ctx[args[0].trim()]);
engine2.register('for', (ctx, args, render) => {
  const itemVar = args[0].trim();
  const itemsKey = args[1].trim();
  const content = args.slice(2);
  return ctx[itemsKey].map(item => render(content, {
    ...ctx,
    [itemVar]: item
  })).join('');
});

const result2 = engine2.render('$for{item;items; ${item}; }', {
  items: ['a', 'b', 'c']
});
// Returns: 'a; b; c; '
```

</details>

<details>
<summary><strong>Complex Nested Expressions</strong></summary>

Combining multiple operators with nested expressions.

```javascript
import { Templater } from 'webdetta/templater';

const engine = Templater({
  operatorSymbol: '$',
  openBracket: '{',
  closeBracket: '}',
  argumentsSeparator: ','
});

engine.register('', (ctx, args) => ctx[args[0].trim()]);

engine.register('if', (ctx, args, render) => {
  const key = args[0].trim();
  const content = args.slice(1);
  if (ctx[key]) return render(content, ctx);
  return '';
});

engine.register('for', (ctx, args, render) => {
  const itemVar = args[0].trim();
  const itemsKey = args[1].trim();
  const content = args.slice(2);
  return ctx[itemsKey].map(item => render(content, {
    ...ctx,
    [itemVar]: item
  })).join('');
});

engine.register('length', (ctx, args) => {
  const key = args[0].trim();
  return ctx[key].length;
});

// Complex nested template
// Template:
//   <h1>${title}</h1>
//   $if{showDescription, <p>${description}</p>}
//   <p>Total items: $length{items}</p>
//   <ul>
//     $for{item,items, <li>${item}</li>}
//   </ul>
const template = '  <h1>${title}</h1>\n  $if{showDescription, <p>${description}</p>}\n  <p>Total items: $length{items}</p>\n  <ul>\n    $for{item,items, <li>${item}</li>}\n  </ul>';

const result = engine.render(template, {
  title: 'My Page',
  showDescription: true,
  description: 'Welcome to my page',
  items: ['Item 1', 'Item 2', 'Item 3']
});

console.log(result);
// Console output:
//   <h1>My Page</h1>
//   <p>Welcome to my page</p>
//   <p>Total items: 3</p>
//   <ul>
//     <li>Item 1</li>
//     <li>Item 2</li>
//     <li>Item 3</li>
//   </ul>
```

</details>

<details>
<summary><strong>Deep Context Properties</strong></summary>

Demonstrates context flattening where nested object properties can be accessed using dot notation.

```javascript
import { Templater } from 'webdetta/templater';

const engine = Templater({
  operatorSymbol: '$',
  openBracket: '{',
  closeBracket: '}',
  argumentsSeparator: ','
});

// Register default operator (empty operatorName) as a getter
engine.register('', (ctx, args) => {
  const key = args[0].trim();
  return ctx[key];
});

// Simple nested properties
const result1 = engine.render('User: ${user.name}, Age: ${user.age}', {
  user: {
    name: 'Alice',
    age: 30
  }
});
// Returns: 'User: Alice, Age: 30'
// Context is flattened: { 'user.name': 'Alice', 'user.age': 30 }

// Deep nesting with multiple levels
const result2 = engine.render('${company.department.manager.name}', {
  company: {
    department: {
      manager: {
        name: 'Bob'
      }
    }
  }
});
// Returns: 'Bob'
// Context is flattened: { 'company.department.manager.name': 'Bob' }

// Register length operator to compute array length
engine.register('length', (ctx, args) => {
  const key = args[0].trim();
  return ctx[key].length;
});

// Complex nested structure example
// Template:
//   Company: ${company.name}
//   Manager: ${company.department.manager.name}
//   Email: ${company.department.manager.contact.email}
//   Team Size: $length{company.department.team}
const template = '  Company: ${company.name}\n  Manager: ${company.department.manager.name}\n  Email: ${company.department.manager.contact.email}\n  Team Size: $length{company.department.team}';

const result3 = engine.render(template, {
  company: {
    name: 'Acme Corp',
    department: {
      manager: {
        name: 'John Doe',
        contact: {
          email: 'john@acme.com'
        }
      },
      team: ['Alice', 'Bob', 'Charlie']
    }
  }
});

console.log(result3);
// Console output:
//   Company: Acme Corp
//   Manager: John Doe
//   Email: john@acme.com
//   Team Size: 3

// Context is automatically flattened to:
// {
//   'company.name': 'Acme Corp',
//   'company.department.manager.name': 'John Doe',
//   'company.department.manager.contact.email': 'john@acme.com',
//   'company.department.team': ['Alice', 'Bob', 'Charlie']
// }
```

</details>

## Complete Example

```javascript
import { Templater } from 'webdetta/templater';

const engine = Templater({
  operatorSymbol: '$',
  openBracket: '{',
  closeBracket: '}',
  argumentsSeparator: ','
});

// Register getter
// ${...args}
engine.register('', (ctx, args) => ctx[args[0].trim()]);

// Register 'if' operator
// $if{...args}
engine.register('if', (ctx, args, render) => {
  const key = args[0].trim();
  const content = args.slice(1);
  if (ctx[key]) return render(content, ctx);
  return '';
});

// Register 'for' operator
// $for{...args}
engine.register('for', (ctx, args, render) => {
  const itemVar = args[0].trim();
  const itemsKey = args[1].trim();
  const content = args.slice(2);
  return ctx[itemsKey].map(item => render(content, {
    ...ctx,
    [itemVar]: item
  })).join('');
});

// Template:
// <h1>${title}</h1>
// $if{showDescription,<p>${description}</p>}
// <ul>
//   $for{item,items,<li>${item}</li>}
// </ul>
const template = '<h1>${title}</h1>\n$if{showDescription,<p>${description}</p>}\n<ul>\n  $for{item,items,<li>${item}</li>}\n</ul>';

// Render
const result = engine.render(template, {
  title: 'My Page',
  showDescription: true,
  description: 'Welcome to my page',
  items: ['Item 1', 'Item 2', 'Item 3']
});

console.log();
console.log('result:');
console.log(result);
// <h1>My Page</h1>
// <p>Welcome to my page</p>
// <ul>
//   <li>Item 1</li>
//   <li>Item 2</li>
//   <li>Item 3</li>
// </ul>
```
