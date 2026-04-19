# Templater({ operatorSymbol, openBracket, closeBracket, argumentsSeparator })

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
