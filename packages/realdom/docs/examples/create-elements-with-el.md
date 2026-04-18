# Create Elements with el

```javascript
import { el } from 'webdetta/realdom';

const card = el.Div(
  el.H2('Title'),
  el.P('Body text'),
);

document.body.append(card);
```
