export const pprintPrice = v =>
  v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
