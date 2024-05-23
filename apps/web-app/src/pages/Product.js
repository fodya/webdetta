import { el, h, v, frag, Component } from '#tk';
import { Icon, Input, SwipePanel } from '#ui';
import { ProductInfo } from '#comp';
import { layout, router, routes } from '#pages';

import * as shop from '#feat/shop.js';
import * as cart from '#feat/cart.js';

export default Component(({ id, action }) => {
  const [items] = shop.stockItems();
  const item = items.find(d => d.id == id);
  if (!item) return el.Div();
  const category = shop.categories.find(d => d.id == item.category);
  
  const cartPanel = h.ref();
  const updatePanels = h.ref()(() => {
    cartPanel()?.[action == 'add' ? 'open' : 'close']?.();
  });
  h.effect([action], updatePanels);
  
  const [count, setCount] = h.val(1);
  h.effect([id], () => { setCount(1); });
  
  const addToCart = () => {
    for (let i = 0; i < count; i++) cart.add(id);
    router.go(-1);
    router.navigate(routes.product, { id, action: 'add' });
  }
  
  layout.set({
    header: null,
    menu: false,
    /*mainButton: !action && ['Добавить в корзину', addToCart],*/
    panels: [
      el.Div(v.fix().row().h`8`.bg`w`.ib`0`.w`f`.brt`l1`,
        el.Div(v.row`bw c`.gap`2`.w.mxw`20`.rigid(),
          el.Div(v.p`2`.ptr().op(count >= 2 ? 1 : .5),
            el.on.click(() => setCount(Math.max(0, count - 1))),
            Icon('minus', 'C', 20)
          ),
          el.Span(v.ts`lg`, count),
          el.Div(v.p`2`.ptr(),
            el.on.click(() => setCount(count + 1)),
            Icon('plus', 'C', 20)
          )
        ),
        el.Div(v.row`c c`.bg`c1`.tc`w`.p`2`.w`f`.m.r`1.5`.ptr().sh`sm`,
          v.Transition('300ms ease', v.Sel('&:hover', v.sh`md`)),
          el.on.click(addToCart),
          'Добавить в корзину'
        )
      ),
      /*SwipePanel({
        ref: v => { cartPanel(v); updatePanels(); },
        backdrop: true,
        direction: 'bottom',
        offset: 200,
        reposition: false,
        onClose: () => router.navigate(routes.product, { id, action: null })
      },
        el.Div(v.bg`w`.w.h`f`.col().h`100vh`.abs().ib`0`.sh`md`
            .p.rtr.rtl`2`.mb`-2px`,
          el.Span('Test')
        )
      )*/
    ]
  });
  
  return ProductInfo({ item });
});
