# inspect()

```javascript
import { Adapter, inspect } from 'webdetta/realcss';
import { Methods } from 'webdetta/realcss/default-methods';

const { methods } = Methods({ unit: [1, 'rem'] });
const { v } = Adapter((_sheet, nodes) => nodes)({ methods });

const style = v.row('c', 'c').gap(2).bgc('black');
console.log(inspect(style));
```
