import { h, el, Fragment, Component } from '../vdom/index.js';

const RouterVdom = Component((router) => {
  const r = router.current();
  RouterVdom.ctx(router);

  const redraw = h.redraw();
  h.effect([], () => {
    router.listen(redraw);
    router.attach();
  });
  if (!r.route) return el.Div();

  const saved = h.ref({})();
  saved[r.route.path] = r.route.value(r.params);

  return Fragment(Object.entries(saved).map(([routepath, page]) => {
    const visible = r.route.path == routepath;
    return page(
      el.key(routepath),
      Component.toggleEffectsLifecycle(visible),
      !visible && el.style.display('none')
    );
  }));
});
RouterVdom.ctx = Component.ctx();

export default RouterVdom;
