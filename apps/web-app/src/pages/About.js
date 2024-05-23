import { el, h, v, throttle, Component } from '#tk';
import { Icon } from '#ui';
import { layout } from '#pages';

import * as shop from '#feat/shop.js';

export default Component(() => {
  layout.set({
    back: false,
    menu: true,
    header: shop.title
  });
  
  return el.Div(v.col().gap`2`.ph`2`,
    shop.menuItems.map(item => el.Div(v.row`l c`.pv`1`.gap(2).ptr(),
      Icon(item.icon, 'C', 24),
      el.Span(item.title)
    )),
  );
});
