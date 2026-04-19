# Snapshot Sync Context

```javascript
import { Context } from 'webdetta/context/sync';

const theme = Context('light');

const runLater = theme.run('dark', () => Context.Snapshot());

console.log(theme()); // 'light'
runLater(() => console.log(theme())); // 'dark'
```
