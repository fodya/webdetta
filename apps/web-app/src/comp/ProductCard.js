import { Component, el, h, v } from '#tk';
import { router, routes } from '#pages';
import * as product from '#feat/product.js';

const ProductCard = Component(({ item, action }) => {
  const { name: title, preview } = item;
  return el.Div(v.col`l bw`.ph`2`.pv`1`.pb`2`.gap`2`.bg`w`.tws`pw`.ptr(),
    //v.bg`hsl(192 7% 93% / .75)`,
    el.on.click(action),
    el.Div(v.col().gap(1),
      el.Div(v.mh`a`.r`2`.ov`h`.w`f`.h`20`.rigid(),
        el.style
          .backgroundImage(`url(${preview})`)
          .backgroundSize('cover')
          .backgroundPosition('center')
          .backgroundRepeat('no-repeat')
      ),
      el.Div(v.col().gap`.5`,
        el.Div(v.row`l bl`.gap(1),
          el.Span(v.tw`semibold`, product.price(item)),
          el.Span(v.ts`sm`.tc`t2`, product.qty(item))
        ),
        el.Span(v.ts`sm`, title),
      )
    )
  )
});

ProductCard.Grid = Component(({ layout, items }) => {
  const [length, setLength] = h.val(20);
  h.effect([length, items], () => {
    const t = setInterval(() => {
      const sc = layout.scrollContainer();
      const top = sc.scrollTop + sc.getBoundingClientRect().height;
      if (top + 1000 > sc.scrollHeight) {
        const length1 = Math.min(items.length, length + 20);
        if (length1 != length) setLength(length1);
      }
    }, 200);
    return () => clearInterval(t);
  });
  
  return el.Div(v.grid(2, null).w`f`.mb`2`,
    h.memo([items, length], () => items.slice(0, length).map((item, i, a) =>
      ProductCard({
        item,
        action: () => router.navigate(routes.product, { id: item.id })
      })
    ))
  )
});

export default ProductCard;
