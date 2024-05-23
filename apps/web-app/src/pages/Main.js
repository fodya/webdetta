import { el, h, v, throttle, Component } from '#tk';
import { Input } from '#ui';
import { ProductCard, CategoryCard } from '#comp';

import { layout, router, routes } from '#pages';
import * as shop from '#feat/shop.js';
import * as t from '#feat/t.js';

export default Component(() => {
  const [search, setSearch] = h.val();
  const [items] = shop.stockItems({ search });
  const count = shop.stockItemsCount({ search });

  layout.set({
    back: false,
    menu: true,
    header: shop.title,
    onSearch: setSearch,
  });

  return el.Div(v.col().gap`2`,
    el.Div(v.row().gap`2`.ovX`a`.w`f`.ph`2`,
      el.on.mousewheel(function (e) {
        this.elm.scrollLeft += e.deltaY;
        e.preventDefault();
      }),
      shop.categories.map(cat => count[cat.id] &&
        CategoryCard({
          item: cat,
          description: count[cat.id] && t.products(count[cat.id]),
          action: () => router.navigate(routes.category, {
            id: cat.id,
            q: search
          })
        })
      )
    ),
    items.length > 0 && [
      el.Span(v.tw`bold`.ts`lg`.mt`2`.mb`-1`.ph`2`, 'Популярные товары'),
      ProductCard.Grid({ layout, items })
    ]
  );
});
