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
      const pr = router.routes[routeKey];
      if (pr.path == r.route?.path) continue;
      saved[pr.path] = pr.value({});
    }
    router.listen(redraw);
    router.attach();
    return () => router.detach();
  });

  return Fragment(Object.entries(saved).map(([routepath, page]) => {
    let isEnabled = r.route?.path == routepath;
    return page(
      Component.preprocess(() => Component.lifecycle(isEnabled)),
      Component.postprocess(el.key(routepath), pageProps(isEnabled, r))
    );
  }));
});
RouterVdom.ctx = Component.Context();

export default RouterVdom;
