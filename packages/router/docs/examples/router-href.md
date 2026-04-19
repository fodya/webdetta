# router.href()

```javascript
import { PathnameRouter } from 'webdetta/router';

const router = PathnameRouter({
  article: ['/articles/:slug', null],
});

console.log(router.href('article', { slug: 'intro', ref: 'docs' }));
// '/articles/intro?ref=docs'
```
