import Router from './base.js';

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

export const PathnameRouter = (routes, { prefix='' }={}) => {
  prefix = prefix.replace(/\/$/, '');
  return Router(routes, {
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

export const HashRouter = routes => Router(routes, {
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
