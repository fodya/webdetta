import { h, el, Fragment, Component } from '../vdom/index.js';

const RouterVdom = Component((router) => {
  RouterVdom.ctx(router);

  const r = router.current();
  const redraw = h.redraw();
  h.effect([], () => {
    router.listen(redraw);
    router.attach();
    return () => router.detach();
  });

  const saved = h.ref({})();
  if (r.route) saved[r.route.path] = r.route.value(r.params);

  return Fragment(Object.entries(saved).map(([routepath, page]) => {
    const visible = r.route?.path == routepath;
    return Component.Lifecycle.Provide(visible, page(
      el.key(routepath),
      !visible && el.style.display('none')
    ));
  }));
});
RouterVdom.ctx = Component.Context();

export default RouterVdom;
