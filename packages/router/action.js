export const routerAction = (router, {
  key='_ra',
  endOnRouteChange=true,
  onBegin,
  onEnd
}={}) => {
  const id = Math.random().toString(16).slice(2, 10);
  const ids = () => new Set(router.current().params[key]?.split?.('|') ?? []);
  const setIds = (method, val) => {
    const { key: route, params } = router.current();
    router[method](route, { ...params, [key]: [...val].join('|') });
  }
  const begin = () => {
    const val = ids();
    if (val.has(id)) return;
    setIds('navigate', (val.add(id), val));
  }
  const end = () => {
    const val = ids();
    if (!val.has(id)) return;
    router.go(-1);
  }

  const currentRoute = router.current().key;
  let prevActive;
  let prevRoute = null;
  router.listen(({key: route, params}) => {
    const active = ids().has(id);
    if (prevRoute != route && endOnRouteChange) {
      end();
      onEnd();
    } else if (prevActive != active) {
      (active ? onBegin : onEnd)();
      prevActive = active;
    }
    prevRoute = route;
  });

  return { begin, end };
}
