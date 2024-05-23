const splitPath = path => path.replace(/\//g, ' ').trim().split(/\s+/);

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
  const res = { route: null, params: search, func: null, location: loc };
  for (const [route, func] of Object.entries(routes)) {
    const params = parsePath(route, loc.pathname);
    if (params) {
      res.route = route;
      res.func = func;
      Object.assign(res.params, params);
      break;
    }
  }
  return res;
}

const Router = (driver) => {
  const handlers = [];
  const listen = (h) => handlers.push(h);
  
  const update = () => {
    const url = driver.get();
    handlers.forEach(h => h(url));
  }
  const attach = () => driver.attach(update);
  const detach = () => driver.detach(update);
  const go = v => driver.go(v);

  const navigate = (route, params) => {
    driver.set({ url: href(route, params), replace: false });
    window.dispatchEvent(new CustomEvent(':router:'));
  }

  const replace = (route, params) => {
    driver.set({ url: href(route, params), replace: true });
    window.dispatchEvent(new CustomEvent(':router:'));
  }

  const location = () => driver.get();
  const route = (routes) => currentRoute(routes, driver.get());
  
  return { attach, detach, route, go, location, navigate, replace, listen };
}

const locationAttachment = {
  attach: (handler) => {
    window.addEventListener(':router:', handler);
    window.addEventListener('popstate', handler);
    window.addEventListener('hashchange', handler);
  },
  detach: (handler) => {
    window.removeEventListener(':router:', handler)
    window.removeEventListener('popstate', handler);
    window.removeEventListener('hashchange', handler);
  },
}

export const pathRouter = ({ prefix }) => {
  prefix = prefix.replace(/\/$/, '');
  return Router({
    ...locationAttachment,
    go: v => window.history.go(v),
    get: () => {
      const loc = {...window.location};
      loc.pathname = loc.pathname.replace(prefix, '');
      return loc;
    },
    set: ({ url, replace }) => {
      url = prefix + '/' + url.replace(/^\//, '');
      window.history[replace ? 'replaceState' : 'pushState']({}, null, url);
      window.dispatchEvent(new CustomEvent(':router:'));
    },
  });
}

export const hashRouter = () => Router({
  ...locationAttachment,
  go: v => window.history.go(v),
  get: () => {
    const [pathname, search] = window.location.hash.replace('#', '').split('?');
    return { pathname, search };
  },
  set: ({ url, replace }) => {
    const url_ = Object.assign(new URL(window.location), { hash: url });
    window.history[replace ? 'replaceState' : 'pushState']({}, null, url_);
    window.dispatchEvent(new CustomEvent(':router:'));
  },
});
