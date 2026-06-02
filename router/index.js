/**
 * Routing library for single page webapps
 * @module
 */
import { contentLoaded, getScrollContainer } from "@webdetta/common/dom";
import { Context } from "@webdetta/context/sync";
import { r } from "@webdetta/reactivity";
import { Element } from "@webdetta/realdom/base";
import { currentRoute, parseRoutes, routeHref } from "./base.js";
import { makeDriver } from "./drivers.js";

/**
 * @typedef {Record<string, string | undefined>} RouteParams
 */

/**
 * @typedef {Object} RouterLocation
 * @property {string} pathname
 * @property {string} search
 * @property {string} [hash]
 */

/**
 * @template V
 * @typedef {[string, V]} RouteDefinition
 */

/**
 * @template V
 * @typedef {Record<string, RouteDefinition<V>>} RouteMap
 */

/**
 * @template V
 * @typedef {Object} ParsedRoute
 * @property {string} key
 * @property {string} path
 * @property {V} value
 */

/**
 * @template V
 * @typedef {Object} RouteMatch
 * @property {string | null} key
 * @property {string | null} path
 * @property {V | null} value
 * @property {RouteParams} params
 * @property {RouterLocation} location
 */

/**
 * @typedef {Object} RouterDriverSetUpdate
 * @property {string} url
 * @property {boolean} replace
 */

/**
 * @typedef {Object} RouterDriver
 * @property {(handler: () => void) => void} attach
 * @property {(handler: () => void) => void} detach
 * @property {() => RouterLocation} get
 * @property {(update: RouterDriverSetUpdate) => void} set
 * @property {(delta: number) => void} go
 */

/**
 * @typedef {'hash' | 'history' | RouterDriver} RouterMode
 */

/**
 * @template V
 * @typedef {Object} RouterOptions
 * @property {RouteMap<V>} routes
 * @property {RouterMode} mode
 * @property {string} [prefix]
 */

/**
 * @typedef {Object} RouterActionOptions
 * @property {string} [key]
 * @property {() => unknown} [val]
 * @property {boolean} [endOnRouteChange]
 * @property {() => void} [onBegin]
 * @property {() => void} [onEnd]
 */

/**
 * @typedef {Object} RouterAction
 * @property {() => void} begin
 * @property {() => void} end
 * @property {() => void} destroy
 */

/**
 * @template V
 * @typedef {Object} Router
 * @property {Record<string, ParsedRoute<V>>} routes
 * @property {() => RouteMatch<V>} current
 * @property {(handler: (route: RouteMatch<V>) => void) => () => void} onChange
 * @property {(callback: (route: RouteMatch<V>) => void | Promise<void>) => () => void} onEnter
 * @property {(routeKey: string, callback: (route: RouteMatch<V>) => void | Promise<void>) => () => void} onEnter
 * @property {(callback: (route: RouteMatch<V>) => void | Promise<void>) => () => void} onLeave
 * @property {(routeKey: string, callback: (route: RouteMatch<V>) => void | Promise<void>) => () => void} onLeave
 * @property {(callback: (route: RouteMatch<V>) => void | Promise<void>) => () => void} onReturn
 * @property {(routeKey: string, callback: (route: RouteMatch<V>) => void | Promise<void>) => () => void} onReturn
 * @property {(delta: number) => void} go
 * @property {(key: string, params?: RouteParams) => void} navigate
 * @property {(key: string, params?: RouteParams) => void} replace
 * @property {(key: string, params?: RouteParams) => string} href
 * @property {() => void} detach
 * @property {(options?: RouterActionOptions) => RouterAction} action
 * @property {Text} node
 */

/**
 * @param {string} routepath
 * @param {string | undefined} pathname
 * @returns {RouteParams | null}
 */
export { parsePath } from "./base.js";

/**
 * @param {string} routepath
 * @param {RouteParams} params
 * @returns {string}
 */
export { makePath } from "./base.js";

/**
 * @param {string} routepath
 * @param {RouteParams} [params]
 * @returns {string}
 */
export { routeHref } from "./base.js";

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
    if (argv.length === 1 && typeof argv[0] === "function") {
      callback = argv[0];
      routeKey = currentKey();
    } else if (argv.length === 2) {
      routeKey = argv[0];
      callback = argv[1];
    }
    if (typeof routeKey !== "string" || typeof callback !== "function") {
      throw new Error(
        "Router: invalid arguments, expected (callback) or (routeKey, callback)",
      );
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

const actionPrefix = "_ra-";
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

  contentLoaded.then(() =>
    setTimeout(() => {
      removeUnusedKeys(router, router.current());
    })
  );

  const destroy = () => {
    unsubscribe();
  };

  return { begin, end, destroy };
};

// ─── Router ───────────────────────────────────────────────────────────────

/**
 * @template V
 * @param {RouterOptions<V>} [options]
 * @returns {Router<V>}
 * @namespace Router
 * @property {import("@webdetta/context/sync").SyncContext<Router<unknown> | undefined>} Ctx Active router during `Router.Ctx.run`.
 */
export const Router = ({ routes, mode, prefix } = {}) => {
  if (!routes) throw new Error("Router: `routes` is required");
  const parsed = parseRoutes(routes);
  const driver = makeDriver(mode, { prefix });

  const node = document.createTextNode("");
  const cache = new Map();
  const scrollMap = new Map();
  const paramVals = {};
  const paramVal = (k, p) => (paramVals[k] ??= {})[p] ??= r.dval();

  let activeKey = null;
  let activeDom = null;

  const api = {};

  const snapshot = Context.Snapshot();
  const setPage = (key, page, params) => {
    const paramKeys = Object.keys({ ...params, ...(paramVals[key] ?? {}) });
    for (const p of paramKeys) paramVal(key, p)(params[p]);

    if (key && page && !cache.has(key)) {
      const proxy = new Proxy({}, { get: (_, p) => paramVal(key, p) });
      const dom = snapshot.set(Router.Ctx, api).run(() => page(proxy));
      cache.set(key, dom);
    }

    const nextDom = key ? cache.get(key) : null;
    if (nextDom === activeDom) return;
    if (activeDom) {
      saveScrollPosition(
        getScrollContainer(node.parentNode),
        scrollMap,
        activeKey,
      );
      Element.remove(activeDom);
    }
    if (nextDom) {
      Element.appendAfter(node, nextDom);
      restoreScrollPosition(
        getScrollContainer(node.parentNode),
        scrollMap,
        key,
      );
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
  api.navigate = (key, params = {}) =>
    driver.set({ url: api.href(key, params), replace: false });
  api.replace = (key, params = {}) =>
    driver.set({ url: api.href(key, params), replace: true });
  api.go = (v) => driver.go(v);
  api.detach = () => driver.detach(update);
  api.action = (options) => routerAction(api, options);

  driver.attach(update);
  Element.registerHook(node, "afterAppend", update);

  Object.freeze(api);
  return api;
};

/**
 * @type {import('@webdetta/context/sync').SyncContext<Router<unknown> | undefined>}
 */
Router.Ctx = Context();
