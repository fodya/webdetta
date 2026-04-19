# router.href()

```javascript
import { Router } from 'webdetta/router';

const router = Router({
  mode: 'history',
  routes: {
    article: ['/articles/:slug', null],
  },
});

console.log(router.href('article', { slug: 'intro', ref: 'docs' }));
// '/articles/intro?ref=docs'
```
