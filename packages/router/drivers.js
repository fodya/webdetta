// @ts-self-types="./types/index.d.ts"

const window = globalThis.window;

const locationAttach = {
  attach: (h) => {
    window.addEventListener(':router:', h);
    window.addEventListener('popstate', h);
    window.addEventListener('hashchange', h);
  },
  detach: (h) => {
    window.removeEventListener(':router:', h);
    window.removeEventListener('popstate', h);
    window.removeEventListener('hashchange', h);
  },
};

const emitRouterEvent = () =>
  window.dispatchEvent(new CustomEvent(':router:'));

const hashDriver = () => ({
  ...locationAttach,
  go: (v) => window.history.go(v),
  get: () => {
    const [pathname, search] = window.location.hash.replace('#', '').split('?');
    return { pathname, search: search ?? '' };
  },
  set: ({ url, replace }) => {
    const u = Object.assign(new URL(window.location), { hash: url });
    window.history[replace ? 'replaceState' : 'pushState']({}, null, u);
    emitRouterEvent();
  },
});

const historyDriver = (prefix = '') => {
  prefix = prefix.replace(/\/$/, '');
  return {
    ...locationAttach,
    go: (v) => window.history.go(v),
    get: () => {
      const loc = { ...window.location };
      loc.pathname = loc.pathname.replace(prefix, '');
      return loc;
    },
    set: ({ url, replace }) => {
      url = prefix + '/' + url.replace(/^\//, '');
      window.history[replace ? 'replaceState' : 'pushState'](null, null, url);
      emitRouterEvent();
    },
  };
};

export const makeDriver = (mode, { prefix } = {}) => {
  if (mode && typeof mode === 'object') return mode;
  if (mode === 'hash') return hashDriver();
  if (mode === 'history') return historyDriver(prefix);
  throw new Error(`Router: unknown mode '${mode}' (expected 'hash' | 'history' | driver object)`);
};
