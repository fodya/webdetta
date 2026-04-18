# HashRouter()

```javascript
import { HashRouter } from 'webdetta/router';

const router = HashRouter({
  feed: ['/feed', 'Feed'],
  post: ['/post/:id', 'Post'],
});

router.replace('post', { id: 9 });
console.log(router.current().params.id); // '9'
```
