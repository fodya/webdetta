const splitPath = path =>
  path.replace(/\//g, ' ').trim().split(/\s+/);

const parsePathParam = part =>
  part.startsWith(':') ? part.slice(1) : null;

export const parsePath = (routepath, pathname) => {
  if (pathname == undefined) return null;
  pathname = splitPath(pathname).map(decodeURIComponent);
  routepath = splitPath(routepath).map((v, i) => [v, i]);
  // if (pathname.length != routepath.length) return null;
  const params = {};
  for (const [part, i] of routepath) {
    const pathPart = pathname[i];
    const key = parsePathParam(part);
    if (key) params[key] = pathPart;
    else if (pathPart != part) return null;
  }
  return params;
};

export const makePath = (routepath, params) => {
  const path = [];
  for (const part of splitPath(routepath)) {
    const key = parsePathParam(part);
    if (key) {
      path.push(params[key]);
      delete params[key];
    }
    else path.push(part);
  }
  return path.join('/');
};

export const href = (routepath, params={}) => (
  '/' + makePath(routepath, params) +
  '?' + new URLSearchParams(Object.fromEntries(
    Object.entries(params).filter(([k, v]) => v !== undefined && v !== null)
  ))
).replace(/\?$/, '');

const currentRoute = (routesList, loc) => {
  let depth = 0;
  const res = { key: null, path: null, value: null, params: {}, location: loc };
  for (const route of routesList) {
    const params = parsePath(route.path, loc.pathname);
    const pathDepth = splitPath(route.path).filter(d => d).length;
    const paramsDepth = Object.values(params ?? {}).filter(d => d).length;
    if (params && pathDepth == paramsDepth && pathDepth >= depth) {
      res.key = route.key;
      res.path = route.path;
      res.value = route.value;
      res.params = params;
      depth = pathDepth;
    }
  }
  Object.assign(res.params, Object.fromEntries(
    new URLSearchParams(loc.search).entries()
  ));
  return res;
}

const Router = (routes, driver) => {
  routes = {...routes};
  for (const [key, arr] of Object.entries(routes)) {
    if (!Array.isArray(arr) || arr.length != 2 || typeof arr[0] != 'string')
      throw new Error('Invalid route');
    routes[key] = { key, path: arr[0], value: arr[1] }
  }

  const handlers = [];
  const listen = (h) => {
    handlers.push(h);
    h(current());
  }

  const update = () => {
    const curr = current();
    handlers.forEach(h => h(curr));
  }
  const attach = () => driver.attach(update);
  const detach = () => driver.detach(update);

  const go = v => driver.go(v);
  const navigate = (key, params={}) =>
    driver.set({ url: href(routes[key].path, params), replace: false });
  const replace = (key, params={}) =>
    driver.set({ url: href(routes[key].path, params), replace: true });

  const current = () => currentRoute(Object.values(routes), driver.get());

  return {
    attach, detach, listen,
    routes, current,
    go, navigate, replace
  };
}

export default Router;
