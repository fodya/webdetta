import { el, h, v, Component } from '#tk';
import { Icon, Input, Loading, SwipePanel } from '#ui';
import { ProductCard } from '#comp';
import { layout, router, routes } from '#pages';

import * as shop from '#feat/shop.js';

export default Component(({id, q}) => {
  const [search, setSearch] = h.val(q);
  const category = shop.categories.find(d => d.id == id);
  const [items, _, {loading}] = shop.stockItems({ search, category: id });

  layout.set({
    menu: true,
    header: category.title,
    onSearch: setSearch
  });

  return el.Div(v.col(),
    Loading('t2')(v.Inline(v.pv`2`.d(!loading ? 'n' : 'f'))),
    ProductCard.Grid({ layout, items })(v.Inline(v.d(loading ? 'n' : 'g')))
  );
});
