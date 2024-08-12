import { h, el, Fragment, Component } from '../vdom/index.js';

const RouterVdom = Component(({
  router,
  preloadPages=[],
  pageProps
}) => {
  RouterVdom.ctx(router);

  const r = router.current();
  const redraw = h.redraw();

  const saved = h.ref({})();
  if (r.route) saved[r.route.path] = r.route.value(r.params);

  h.effect([], () => {
    for (const routeKey of preloadPages) {
      if (routeKey == r.route.key) continue;
      saved[r.route.key] = r.route.value({});
    }
    router.listen(redraw);
    router.attach();
    return () => router.detach();
  });

  return Fragment(Object.entries(saved).map(([routepath, page]) => {
    const isCurrent = r.route?.path == routepath;
    return Component.Lifecycle.Provide(isCurrent, page(
      el.key(routepath),
      pageProps(isCurrent, r)
    ));
  }));
});
RouterVdom.ctx = Component.Context();

export default RouterVdom;
