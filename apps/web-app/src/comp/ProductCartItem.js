import { Component, el, h, v } from '#tk';
import { Icon } from '#ui';
import { router, routes } from '#pages';
import * as product from '#feat/product.js';

const ProductCartItem = Component(({ item, count, setCount }) => {
  const { name: title, preview } = item;
  return el.Div(v.row`l c`.pv`1`.pb`2`.gap`2`.bg`w`.tws`pw`.ptr(),
    //v.bg`hsl(192 7% 93% / .75)`,
    el.Div(v.r`2`.ov`h`.w`f`.h.w`8`.rigid(),
      el.style
        .backgroundImage(`url(${preview})`)
        .backgroundSize('cover')
        .backgroundPosition('center')
        .backgroundRepeat('no-repeat')
    ),
    el.Div(v.col().gap`.5`.flex`1`,
      el.Span(v.ts`sm`, title),
    ),
    el.Div(v.col`r c`.gap`1`.h`f`,
      el.Span(v.row`l bl`.ts`xs`.tc`t2`.tws`p`,
        [
          product.price(item),
          product.qty(item)
        ].filter(v => v).join(' / ')
      ),
      el.Div(v.row`bw c`.w.mxw`12`.r`1`.br`l1`.rigid(),
        el.Div(v.p`1`.ptr(),
          el.on.click(() => setCount(Math.max(0, count - 1))),
          Icon('minus', 'C', 20)
        ),
        el.Span(v.ts`md`, count),
        el.Div(v.p`1`.ptr(),
          el.on.click(() => setCount(count + 1)),
          Icon('plus', 'C', 20)
        )
      ),
      el.Span(v.mt`a`.tw`semibold`, product.price(item, { count })),
    )
  )
});

export default ProductCartItem;
