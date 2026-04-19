# PathnameRouter()

```javascript
import { PathnameRouter } from 'webdetta/router';

const router = PathnameRouter({
  home: ['/', 'Home page'],
  user: ['/users/:id', 'User page'],
});

router.listen((route) => console.log(route.key, route.params));
router.navigate('user', { id: 42 });
```
