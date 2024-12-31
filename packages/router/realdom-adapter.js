import { el } from '../realdom/index.js';
import { r } from '../reactivity/index.js';
import { Context } from '../common/context.js';

const RouterRealdom = ({
  router,
  preloadPages=[]
}) => {
  const currentRoute = r.val();
  const loadedRoutes = r.val({});
  const listener = ({ route }) => {
    const { key, value } = route;
    const loaded = loadedRoutes();
    loaded[key] ??= RouterRealdom.ctx.run(router, value);
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
