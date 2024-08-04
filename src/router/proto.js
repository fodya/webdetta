const splitPath = path =>
  path.replace(/\//g, ' ').trim().split(/\s+/);

const parsePathParam = part =>
  part.startsWith(':') ? part.slice(1) : null;

export const parsePath = (route, pathname) => {
  if (pathname == undefined) return null;
  pathname = splitPath(pathname).map(decodeURIComponent);
  route = splitPath(route).map((v, i) => [v, i]);
  if (pathname.length != route.length) return null;
  const params = {};
  for (const [part, i] of route) {
    const pathPart = pathname[i];
    const key = parsePathParam(part);
    if (key) params[key] = pathPart;
    else if (pathPart != part) return null;
  }
  return params;
};

export const makePath = (route, params) => {
  const path = [];
  for (const part of splitPath(route)) {
    const key = parsePathParam(part);
    if (key) {
      path.push(params[key]);
      delete params[key];
    }
    else path.push(part);
  }
  return path.join('/');
};

export const href = (route, params={}) => (
  '/' + makePath(route, params) + '?' + new URLSearchParams(Object.fromEntries(
    Object.entries(params).filter(([k, v]) => v !== undefined && v !== null)
  ))
).replace(/\?$/, '');

const currentRoute = (routes, loc) => {
  const search = Object.fromEntries(
    new URLSearchParams(loc.search).entries()
  );
  const res = {
    key: null,
    route: null,
    value: null,
    params: search,
    location: loc
  };
  for (const [key, [route, value]] of Object.entries(routes)) {
    const params = parsePath(route, loc.pathname);
    if (params) {
      Object.assign(res, { key, route, value });
      Object.assign(res.params, params);
      break;
    }
  }
  return res;
}

const RouterInstance = (driver, routes) => {
  const handlers = [];
  const listen = (h) => handlers.push(h);

  const update = () => {
    const url = driver.get();
    handlers.forEach(h => h(url));
  }
  const attach = () => driver.attach(update);
  const detach = () => driver.detach(update);

  const go = v => driver.go(v);
  const navigate = (route, params) =>
    driver.set({ url: href(route, params), replace: false });

  const replace = (route, params) =>
    driver.set({ url: href(route, params), replace: true });

  const route = () => currentRoute(routes, driver.get());

  return {
    attach, detach, listen,
    routes, currentRoute: route,
    go, navigate, replace
  };
}

const Router = driver => routes => RouterInstance(driver, routes);

export default Router;
