# Inline Style Adapter

```javascript
import { Adapter } from 'webdetta/realcss';

const adapter = Adapter((_sheet, nodes) => nodes)({
  methods: {
    bg: (color) => ({ backgroundColor: color }),
  },
});

const node = adapter.v.Inline.bg('tomato');
console.log(node);
```
