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
      loaded.set(key, { key, dom });
    }

    loadedRoutes(loaded);
    currentRoute(key);
  }
  router.listen((...a) => {
    // 1
    r.untrack(listener.bind(null, ...a));
  });
  router.attach();

  const container = el.list(loadedRoutes, ({ key, dom }) => {
    const isVisible = () => currentRoute() == key;
    return el.append(dom,
      el.if(() => !isVisible(), el.style.display`none`),
    );
  });
  return { container, router };
};
RouterRealdom.ctx = Context();

export default RouterRealdom;
