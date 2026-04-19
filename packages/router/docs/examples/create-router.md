# Router()

```javascript
import { Router } from 'webdetta/router';

const router = Router({
  mode: 'history',
  routes: {
    home: ['/',             ({}) => 'Home page'],
    user: ['/users/:id',    ({ id }) => `User ${id()}`],
  },
});

document.body.append(router.node);

router.listen((route) => console.log(route.key, route.params));
router.navigate('user', { id: 42 });
```

Switch to hash-based routing by replacing `mode: 'history'` with `mode: 'hash'`,
or provide a custom driver:

```javascript
const router = Router({
  mode: {
    attach(h) { /* subscribe to location changes */ },
    detach(h) { /* unsubscribe */ },
    get() { return { pathname: '/foo', search: '' }; },
    set({ url, replace }) { /* write location */ },
    go(delta) { /* history.go */ },
  },
  routes: { /* ... */ },
});
```

Read the active router from nested components via the module-level context:

```javascript
import { Router } from 'webdetta/router';

function Page() {
  const router = Router.Ctx();
  // use router.navigate(), router.current(), etc.
}
```
