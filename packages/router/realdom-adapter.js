import { el } from '../realdom/index.js';
import { r } from '../reactivity/index.js';
import { Context } from '../common/context.js';

const RouterRealdom = ({
  router,
  preloadPages=[]
}) => {
  const currentRoute = r.val();
  const loadedRoutes = r.val({});
  window.x = { currentRoute, loadedRoutes, router };
  const listener = ({ route }) => {
    const { key, value } = route;
    const loaded = loadedRoutes();
    loaded[key] ??= {
      key,
      dom: RouterRealdom.ctx.run(router, value)
    };
    loadedRoutes(loaded);
    currentRoute(key);
  }
  router.listen(listener);
  router.attach();

  return el[':'](
    el.list(() => Object.values(loadedRoutes()), ({ key, dom }) => {
      const isVisible = () => currentRoute() == key;
      const res = el.append(dom,
        el.style.display(() => isVisible() ? 'flex' : 'none'),
      );
      return res;
    })
  );
};
RouterRealdom.ctx = Context();

export default RouterRealdom;
