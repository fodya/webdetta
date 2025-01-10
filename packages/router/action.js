const rand = () => Math.random().toString(16).slice(2, 10);
export const routerAction = (router, {
  key='_ra-' + rand(),
  val=() => 1,
  endOnRouteChange=true,
  onBegin,
  onEnd
}={}) => {
  const isActive = () => !!router.current().params[key];

  const begin = () => {
    if (isActive()) return;
    const { key: route, params } = router.current();
    router.navigate(route, { ...params, [key]: val() });
  }
  const end = () => {
    if (!isActive()) return;
    router.go(-1);
  }

  const currentRoute = router.current().key;
  let prevRoute;
  let prevActive;
  router.listen(({ key: route, params }) => {
    const active = isActive();
    console.log({ route, prevRoute, active, prevActive });
    if (prevRoute && prevRoute != route && endOnRouteChange) {
      end();
      onEnd();
    } else if (prevActive != active) {
      (active ? onBegin : onEnd)();
    }
    prevActive = active;
    prevRoute = route;
  });

  return { begin, end };
}
