import { el } from '../realdom/index.js';
import { r } from '../reactivity/index.js';
import { Context } from '../common/context.js';

const RouterRealdom = ({
  router,
  preloadPages=[]
}) => {
  const paramVals = {};
  const paramVal = (key, param) => (paramVals[key] ??= {})[param] ??= r.val();

  const currentRoute = r.val();
  const loadedRoutes = r.val({});
  const listener = ({ key, value, params }) => {
    const loaded = loadedRoutes();
    console.log(key, params);
    const paramKeys = Object.keys({ ...params, ...(paramVals[key] ?? {}) });
    for (const param of paramKeys)
      paramVal(key, param)(params[param]);

    loaded[key] ??= RouterRealdom.ctx.run(router, () =>
      value(new Proxy({}, { get: (_, param) => paramVal(key, param) }))
    );

    loadedRoutes(loaded);
    currentRoute(key);
  }
  router.listen(listener);
  router.attach();

  const container = el[':'](
    el.list(() => Object.entries(loadedRoutes()), ([key, dom]) => {
      const isVisible = () => currentRoute() == key;
      return el.append(dom,
        el.style.display(() => isVisible() ? 'flex' : 'none'),
      );
    })
  );
  return { container, router };
};
RouterRealdom.ctx = Context();

export default RouterRealdom;
