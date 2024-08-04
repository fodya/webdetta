import { h, el, Fragment, Component } from '../vdom/index.js';

const RouterVdom = Component((router) => {
  const r = router.currentRoute();
  RouterVdom.ctx(router);

  const redraw = h.redraw();
  h.effect([], () => {
    router.listen(redraw);
    router.attach();
  });
  if (!r.route || !r.value) return el.Div();

  const saved = h.ref({})();
  saved[r.route] = r.value(r.params);

  return Fragment(Object.entries(saved).map((route, page) => {
    const visible = r.route == route;
    return page(
      el.key(route),
      Component.toggleLifecycle(visible),
      !visible && el.style.display('none')
    );
  }));
});
RouterVdom.ctx = Component.ctx();

export default RouterVdom;
