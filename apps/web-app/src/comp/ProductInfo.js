import { Component, el, v } from '#tk';
import { MD } from '#ui';
import * as product from '#feat/product.js';

export default Component(({ item }) => {
  const { name: title, description, preview } = item;
  return el.Div(v.col`l bw`.gap`2`.bg`w`,
    el.style
      .backgroundImage(`url(${preview})`)
      .backgroundSize('100vw')
      .backgroundPosition('top left')
      .backgroundRepeat('no-repeat')
      .backgroundAttachment('fixed'),
    el.Div(v.ph`2`.pb`8`.pt`1.5`.r`2`.mt`44`.mnh`85vh`.sh`-sm`.bg`w`.col().gap`2`,
      el.Span(v.ts`lg`.tw`bold`.tws`pw`, title),
      el.Div(v.row('bl', 'l').mv`-1`.gap(.5),
        el.Span(v.ts`lg`.tw`semibold`, product.price(item)),
        el.Span(v.ts`md`.tc`t2`, product.qty(item))
      ),
      el.Div(v.col().gap(2).twb`b`.tws`pw`,
        MD(description)(v.ts`sm`)
      )
    )
  )
});
