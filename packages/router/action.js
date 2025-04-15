const pref = '_ra-';
const rand = () => Math.random().toString(16).slice(2, 10);
const keys = new Set();

const removeUnusedKeys = (router, route) => {
  let changed;
  const newParams = {};
  for (const [key, val] of Object.entries(route.params)) {
    if (key.startsWith(pref) && !keys.has(key)) changed = true;
    else newParams[key] = val;
  }
  if (changed) router.replace(route.key, newParams);
}

export const routerAction = (router, {
  key=pref + rand(),
  val=() => 1,
  endOnRouteChange=true,
  onBegin,
  onEnd
}={}) => {
  keys.add(key);
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

  let prevRoute;
  let prevActive;
  router.listen(({ key: route }) => {
    const active = isActive();
    if (prevRoute && prevRoute != route && endOnRouteChange) {
      end();
      onEnd();
    } else if (prevActive != active) {
      (active ? onBegin : onEnd)();
      prevActive = active;
    }
    prevRoute = route;
  });

  window.addEventListener('load', () => setTimeout(() => {
    removeUnusedKeys(router, router.current());
  }));

  return { begin, end };
}
