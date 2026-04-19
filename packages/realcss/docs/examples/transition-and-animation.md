# Transition and Animation

```javascript
import { Adapter } from 'webdetta/realcss';
import { Methods } from 'webdetta/realcss/default-methods';

const { methods } = Methods({ unit: [1, 'rem'] });
const { v } = Adapter((_sheet, nodes) => nodes)({ methods });

const pulse = v.Animation('1s linear infinite', {
  0: [v.op(0.2)],
  100: [v.op(1)],
});
const transition = v.Transition('200ms ease', v.bgc('black'));
console.log(pulse, transition);
```
