import { el } from '../realdom/index.js';
import { r } from '../reactivity/index.js';
import { Context } from '../context/sync.js';

const RouterRealdom = ({
  router
}) => {
  const paramVals = {};
  const paramVal = (key, param) => (paramVals[key] ??= {})[param] ??= r.dval();

  const currentRoute = r.val();
  const loadedRoutes = r.val(new Map());
  const listener = ({ key, value: page, params }) => {
    // 2
    const loaded = loadedRoutes();
    const paramKeys = Object.keys({ ...params, ...(paramVals[key] ?? {}) });
    for (const param of paramKeys) {
      paramVal(key, param)(params[param]);
    }

    if (!loaded.has(key)) {
      const proxy = new Proxy({}, { get: (_, param) => paramVal(key, param) });
      const dom = RouterRealdom.ctx.run(router, () => {
        return page(proxy);
      });
      loaded.set(key, dom);
    }

    loadedRoutes(loaded);
    currentRoute(key);
  }
  router.listen((...a) => r.untrack(listener.bind(null, ...a)));
  router.attach();

  r.effect(() => {
    for (const [key, dom] of loadedRoutes()) {
      dom.style.display = currentRoute() == key ? 'flex' : 'none';
    }
  });

  const container = el.list(loadedRoutes, dom => dom);
  return { container, router };
};
RouterRealdom.ctx = Context();

export default RouterRealdom;
