# createDynamic()

```javascript
import { createDynamic } from 'webdetta/realdom/dynamic';
import { el } from 'webdetta/realdom';
import { r } from 'webdetta/reactivity';

const page = r.val('home');
const node = createDynamic(page, (value) =>
  value === 'home' ? el.H1('Home') : el.H1('Profile')
);

document.body.append(node);
page('profile');
```
