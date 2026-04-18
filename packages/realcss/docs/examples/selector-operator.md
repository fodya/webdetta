# Selector Operator

```javascript
import { Adapter } from 'webdetta/realcss';
import { Methods } from 'webdetta/realcss/default-methods';

const { methods } = Methods({ unit: [1, 'rem'] });
const { v } = Adapter((_sheet, nodes) => nodes)({ methods });

const rule = v.Sel('&:hover', v.tc('red'));
console.log(rule);
```
