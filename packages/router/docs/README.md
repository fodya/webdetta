# webdetta/router

Client-side routing with a single factory.

```javascript
import { Router } from 'webdetta/router';

const router = Router({
  mode: 'history',
  routes: {
    home: ['/',          Home],
    user: ['/user/:id',  User],
  },
});

document.body.append(router.node);
router.navigate('user', { id: '42' });
```

`Router({ routes, mode, prefix?, scrollContainer? })` returns:

- `node` — anchor `Text` node; pages attach as siblings after it.
- `current()`, `listen(h)` — read/observe the current match.
- `navigate`, `replace`, `go`, `href`, `detach` — navigation primitives.
- `action(opts)` — scoped actions tied to a route match.

The module-level `Router.Ctx` is a sync context carrying the active router
during page renders. Descendants can read it via `Router.Ctx()`.

`mode` accepts `'hash'`, `'history'`, or a custom driver object with
`{ attach, detach, get, set, go }`. `prefix` is only used with `'history'`.

When the active route changes, the previous page is removed from the DOM and
the next one is inserted via `node.after(nextDom)`. Pages are rendered once
and cached, so their internal state survives navigation. Scroll position is
saved per route and restored on return. If `scrollContainer` is omitted, the
nearest scrollable ancestor of `node` is discovered lazily per swap via
`getScrollContainer` from `webdetta/common/dom`.
