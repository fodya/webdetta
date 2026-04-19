// @ts-self-types="./types/index.d.ts"
import { DCL, getScrollContainer } from '../common/dom.js';
import { callFn } from '../common/utils.js';
import { Context } from '../context/sync.js';
import { r } from '../reactivity/index.js';
import { Element } from '../realdom/base.js';
import { currentRoute, parseRoutes, routeHref } from './base.js';

export { parsePath, makePath, routeHref } from './base.js';

// ─── Drivers ──────────────────────────────────────────────────────────────

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

const makeDriver = (mode, { prefix } = {}) => {
  if (mode && typeof mode === 'object') return mode;
  if (mode === 'hash') return hashDriver();
  if (mode === 'history') return historyDriver(prefix);
  throw new Error(`Router: unknown mode '${mode}' (expected 'hash' | 'history' | driver object)`);
};

// ─── Action ───────────────────────────────────────────────────────────────

const actionPrefix = '_ra-';
const actionRand = () => Math.random().toString(16).slice(2, 10);
const actionKeys = new Set();

const removeUnusedKeys = (router, route) => {
  let changed;
  const next = {};
  for (const [key, val] of Object.entries(route.params)) {
    if (key.startsWith(actionPrefix) && !actionKeys.has(key)) changed = true;
    else next[key] = val;
  }
  if (changed) router.replace(route.key, next);
};

const routerAction = (router, {
  key = actionPrefix + actionRand(),
  val = () => 1,
  endOnRouteChange = true,
  onBegin,
  onEnd,
} = {}) => {
  actionKeys.add(key);
  const isActive = () => key in router.current().params;

  const begin = () => {
    if (isActive()) return;
    const { key: route, params } = router.current();
    router.navigate(route, { ...params, [key]: val() });
  };
  const end = () => {
    if (!isActive()) return;
    const { key: route, params } = router.current();
    const { [key]: _drop, ...rest } = params;
    router.replace(route, rest);
  };

  let prevRoute;
  let prevActive;
  const unsubscribe = router.listen(({ key: route }) => {
    const active = isActive();
    if (prevRoute && prevRoute != route && endOnRouteChange) {
      end();
      onEnd?.();
    } else if (prevActive != active) {
      (active ? onBegin : onEnd)?.();
      prevActive = active;
    }
    prevRoute = route;
  });

  DCL.then(() => setTimeout(() => {
    removeUnusedKeys(router, router.current());
  }));

  const destroy = () => { unsubscribe(); };

  return { begin, end, destroy };
};

// ─── Router ───────────────────────────────────────────────────────────────

export const Router = ({ routes, mode, prefix, scrollContainer } = {}) => {
  if (!routes) throw new Error('Router: `routes` is required');
  const parsed = parseRoutes(routes);
  const driver = makeDriver(mode, { prefix });

  const node = document.createTextNode('');
  const cache = new Map();
  const scrollMap = new Map();
  const paramVals = {};
  const paramVal = (k, p) => (paramVals[k] ??= {})[p] ??= r.dval();

  let activeKey = null;
  let activeDom = null;

  const resolveScrollContainer = () => {
    return callFn(scrollContainer) ?? getScrollContainer(node.parentNode);
  };

  const swapPage = ({ key, value: page, params }) => {
    const paramKeys = Object.keys({ ...params, ...(paramVals[key] ?? {}) });
    for (const p of paramKeys) paramVal(key, p)(params[p]);

    if (key && page && !cache.has(key)) {
      const proxy = new Proxy({}, { get: (_, p) => paramVal(key, p) });
      const dom = Router.Ctx.run(self, () => page(proxy));
      cache.set(key, dom);
    }
    const nextDom = key ? cache.get(key) : null;
    if (nextDom === activeDom) return;

    if (activeDom) {
      const sc = resolveScrollContainer();
      if (sc) scrollMap.set(activeKey, { top: sc.scrollTop, left: sc.scrollLeft });
      Element.remove(activeDom);
    }
    if (nextDom) {
      Element.appendAfter(node, nextDom);
      const sc = resolveScrollContainer();
      const saved = scrollMap.get(key) ?? { top: 0, left: 0 };
      if (sc) { sc.scrollTop = saved.top; sc.scrollLeft = saved.left; }
    }
    activeKey = key;
    activeDom = nextDom;
  };

  const handlers = [];
  const listen = (h) => {
    handlers.push(h);
    h(current());
    return () => {
      const i = handlers.indexOf(h);
      if (i >= 0) handlers.splice(i, 1);
    };
  };

  const current = () => currentRoute(Object.values(parsed), driver.get());

  const update = () => {
    const match = current();
    r.untrack(() => swapPage(match));
    for (const h of handlers) h(match);
  };

  const href = (key, params = {}) =>
    routeHref(parsed[key].path, { ...params });
  const navigate = (key, params = {}) =>
    driver.set({ url: href(key, params), replace: false });
  const replace = (key, params = {}) =>
    driver.set({ url: href(key, params), replace: true });
  const go = (v) => driver.go(v);
  const detach = () => driver.detach(update);
  const action = (options) => routerAction(self, options);

  let self;
  self = {
    routes: parsed,
    current, listen,
    go, navigate, replace, href,
    detach, action,
    node,
  };

  driver.attach(update);
  Element.registerHook(node, 'afterAppend', update);

  return self;
};

Router.Ctx = Context();
