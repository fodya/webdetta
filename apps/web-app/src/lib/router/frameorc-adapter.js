import { h, el, frag, throttle, Component } from '../toolkit/index.js';
export default Component((router, pages) => {
  const route = router.route(pages);

  const redraw = h.redraw();
  h.effect([], () => {
    router.listen(redraw);
    router.attach();
  });
  if (!route) return el.Div();

  const visited = h.ref(new Set())();
  const saved = h.ref({})();
  
  if (route?.route) visited.add(route.route);
  saved[route.route] = route.func(route.params, router);
  
  return frag(
    !route?.route && (pages['404']?.() ?? el.Div('not found')),
    [...visited].map(route_ => saved[route_](
      route.route != route_ && Component.freeze,
      el.key(route_),
      el.style.display(route.route == route_ ? 'flex' : 'none')
    ))
  );
});
