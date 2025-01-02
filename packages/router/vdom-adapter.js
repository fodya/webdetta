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
  if (r.route) saved[r.path] = r.route.value(r.params);

  h.effect([], () => {
    for (const routeKey of preloadPages) {
      const pr = router.routes[routeKey];
      if (pr.path == r?.path) continue;
      saved[pr.path] = pr.value({});
    }
    router.listen(redraw);
    router.attach();
    return () => router.detach();
  });

  const [preloaded] = h.val({});
  const preloadPaths = preloadPages.map(k => router.routes[k].path);
  return Fragment(Object.entries(saved).map(([routePath, page]) => {
    const isVisible = r?.path == routePath;
    let isAlive = isVisible;
    if (preloadPaths.includes(routePath))
      preloaded[preloadPaths] ??= (isAlive = true);
    return page(
      Component.preprocess(() => Component.lifecycle(isAlive)),
      Component.postprocess(el.key(routePath), pageProps(isVisible, r))
    );
  }));
});
RouterVdom.ctx = Component.Context();

export default RouterVdom;
