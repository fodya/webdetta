import { el, h, v, throttle, Component } from '#tk';
import { Input } from '#ui';
import { ProductCartItem } from '#comp';
import { layout } from '#pages';

import * as shop from '#feat/shop.js';
import * as cart from '#feat/cart.js';
import { pprintPrice } from '#feat/common.js';

export default Component(() => {
  
  const [items] = shop.stockItems();
  const redraw = h.redraw();
  const cartItems = cart.entries()
    .map(([id, count]) => [items.find(d => d.id == id), count])
    .filter(([item, count]) => item && count > 0);
  
  const totalPrice = cartItems.reduce((r, [item, count]) =>
    r + item.price * count
  , 0);
  
  const next = () => {
  
  }
  
  layout.set({
    back: true,
    header: 'Корзина',
    mainButton: totalPrice > 0 && [
      `Оплатить ${pprintPrice(totalPrice)} ${shop.currency}`,
      next
    ]
  });

  return el.Div(v.col().ph`2`,
    cartItems.map(([item, count], i, a) => ProductCartItem({
      item,
      count,
      setCount: val => { cart.set(item.id, val); redraw(); }
    })(i + 1 < a.length && v.brb`l0`))
  );
});
