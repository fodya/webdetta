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
