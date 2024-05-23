import { currency, qtyTypes, qtyTypesVerbose } from './shop.js';
import { pprintPrice } from './common.js';

export const price = (product, { count=1 } = {}) => {
  if (!product.price) return null;
  return `${pprintPrice(product.price * count)} ${currency}`
}
  
export const qty = (product, { count=1, verbose=false }={}) => {
  const t = verbose ? qtyTypesVerbose : qtyTypes;
  if (!product.qty || !t[product.qty_type]) return null;
  return [
    `${product.qty} ${t[product.qty_type]}`,
    (count > 1 ? `⨯ ${count}` : ''),
  ].join(' ');
}
  
export const pricePerQty = (product) =>
  `${price(product)} за ${qty(product, { verbose: true })}`;
