// @ts-self-types="./types/index.d.ts"
import { DCL, getScrollContainer } from '../common/dom.js';
import { Context } from '../context/sync.js';
import { r } from '../reactivity/index.js';
import { Element } from '../realdom/base.js';
import { currentRoute, parseRoutes, routeHref } from './base.js';
import { makeDriver } from './drivers.js';

export { parsePath, makePath, routeHref } from './base.js';

// ─── Route lifecycle ──────────────────────────────────────────────────────

function enteredRoute(routeKey, prevKey, currentKey) {
  return currentKey === routeKey && (prevKey === null || prevKey !== routeKey);
}

function saveScrollPosition(scrollContainer, scrollMap, routeKey) {
  if (!scrollContainer) return;
  scrollMap.set(routeKey, {
    top: scrollContainer.scrollTop,
    left: scrollContainer.scrollLeft,
  });
}

function restoreScrollPosition(scrollContainer, scrollMap, routeKey) {
  if (!scrollContainer) return;
  const saved = scrollMap.get(routeKey) ?? { top: 0, left: 0 };
  scrollContainer.scrollTop = saved.top;
  scrollContainer.scrollLeft = saved.left;
}

function createRouteHooks(onChange, currentKey) {
  function normalizeArgs() {
    const argv = Array.prototype.slice.call(arguments, 0);
    let routeKey;
    let callback;
    if (argv.length === 1 && typeof argv[0] === 'function') {
      callback = argv[0];
      routeKey = currentKey();
    } else if (argv.length === 2) {
      routeKey = argv[0];
      callback = argv[1];
    }
    if (typeof routeKey !== 'string' || typeof callback !== 'function') {
      throw new Error('Router: invalid arguments, expected (callback) or (routeKey, callback)');
    }
    return { routeKey, callback };
  }

  function onEnter() {
    const { routeKey, callback } = normalizeArgs(...arguments);
    let prevKey = null;
    return onChange((match) => {
      const k = match.key;
      if (enteredRoute(routeKey, prevKey, k)) callback(match);
      prevKey = k;
    });
  }

  function onLeave() {
    const { routeKey, callback } = normalizeArgs(...arguments);
    let prevKey = null;
    return onChange((match) => {
      const k = match.key;
      if (prevKey === routeKey && k !== routeKey) callback(match);
      prevKey = k;
    });
  }

  function onReturn() {
    const { routeKey, callback } = normalizeArgs(...arguments);
    let prevKey = null;
    return onChange((match) => {
      const k = match.key;
      if (enteredRoute(routeKey, prevKey, k)) callback(match);
      prevKey = k;
    });
  }

  return { onEnter, onLeave, onReturn };
}

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
  const unsubscribe = router.onChange(({ key: route }) => {
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

export const Router = ({ routes, mode, prefix } = {}) => {
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

  const api = {};

  const setPage = (key, page, params) => {
    const paramKeys = Object.keys({ ...params, ...(paramVals[key] ?? {}) });
    for (const p of paramKeys) paramVal(key, p)(params[p]);

    if (key && page && !cache.has(key)) {
      const proxy = new Proxy({}, { get: (_, p) => paramVal(key, p) });
      const dom = Router.Ctx.run(api, () => page(proxy));
      cache.set(key, dom);
    }
    
    const nextDom = key ? cache.get(key) : null;
    if (nextDom === activeDom) return;
    if (activeDom) {
      saveScrollPosition(getScrollContainer(node.parentNode), scrollMap, activeKey);
      Element.remove(activeDom);
    }
    if (nextDom) {
      Element.appendAfter(node, nextDom);
      restoreScrollPosition(getScrollContainer(node.parentNode), scrollMap, key);
    }
    activeKey = key;
    activeDom = nextDom;
  };

  const current = () => currentRoute(Object.values(parsed), driver.get());

  const handlers = [];
  const onChange = (h) => {
    handlers.push(h);
    h(current());
    return () => {
      const i = handlers.indexOf(h);
      if (i >= 0) handlers.splice(i, 1);
    };
  };

  const currentKey = () => current().key;
  const { onEnter, onLeave, onReturn } = createRouteHooks(
    onChange,
    currentKey,
  );

  const update = () => {
    const match = current();
    r.untrack(() => setPage(match.key, match.value, match.params));
    for (const h of handlers) h(match);
  };

  api.routes = parsed;
  api.node = node;
  api.current = current;
  api.onChange = onChange;
  api.onEnter = onEnter;
  api.onLeave = onLeave;
  api.onReturn = onReturn;
  api.href = (key, params = {}) => routeHref(parsed[key].path, { ...params });
  api.navigate = (key, params = {}) => driver.set({ url: api.href(key, params), replace: false });
  api.replace = (key, params = {}) => driver.set({ url: api.href(key, params), replace: true });
  api.go = (v) => driver.go(v);
  api.detach = () => driver.detach(update);
  api.action = (options) => routerAction(api, options);

  driver.attach(update);
  Element.registerHook(node, 'afterAppend', update);

  Object.freeze(api);
  return api;
};

Router.Ctx = Context();
