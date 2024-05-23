const declension = (count, one, few, many) => {
  const c = count % 100, d = Math.abs(count % 10);
  const decl = (
    Math.floor(count) !== count ? few :
    d === 1 && d !== 11 ? one :
    2 <= d && d <= 4 && (c < 10 || 20 <= c) ? few :
    many
  );
  return count + ' ' + decl;
}

export const products = v => declension(v, 'товар', 'товара', 'товаров');
