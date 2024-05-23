const cart = (() => {
  try { return JSON.parse(localStorage.cart); }
  catch { return {}; }
})();
const save = () => localStorage.cart = JSON.stringify(cart);

export const add = (id) => {
  cart[id] ??= 0;
  cart[id]++;
  save();
}

export const entries = () => Object.entries(cart);

export const get = id => cart[id];
export const set = (id, val) => {
  cart[id] = val;
  save();
}
