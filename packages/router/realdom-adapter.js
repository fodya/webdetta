import { el } from '../realdom/index.js';
import { r } from '../reactivity/index.js';
import { Context } from '../common/context.js';

const RouterRealdom = ({
  router,
  preloadPages=[]
}) => {
  const paramVals = {};
  const currentRoute = r.val();
  const loadedRoutes = r.val({});
  const listener = ({ key, value, params }) => {
    const loaded = loadedRoutes();

    paramVals[key] ??= {};
    for (const [k, v] of Object.entries(params)) {
      const val = paramVals[key][k] ??= r.val();
      val(v);
    }

    loaded[key] ??= RouterRealdom.ctx.run(router, () =>
      value(new Proxy({}, { get: (_, k) => paramVals[key][k] }))
    );

    loadedRoutes(loaded);
    currentRoute(key);
  }
  router.listen(listener);
  router.attach();

  return el[':'](
    el.list(() => Object.entries(loadedRoutes()), ([key, dom]) => {
      const isVisible = () => currentRoute() == key;
      return el.append(dom,
        el.style.display(() => isVisible() ? 'flex' : 'none'),
      );
    })
  );
};
RouterRealdom.ctx = Context();

export default RouterRealdom;
