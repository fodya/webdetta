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
