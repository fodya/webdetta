import md from 'https://cdn.jsdelivr.net/npm/markdown-it@14.1.0/+esm'
import { Component, el, v, h } from '#tk';
import * as product from '#feat/product.js';
export default Component((text) => {
  const ref = h.ref({ dom: null, update: () => {} })();
  ref.update = () => {
    if (!ref.dom) return;
    ref.dom.innerHTML = md().render(text);
  }
  h.effect([text], () => ref.update());
  
  return el.Div(v.col(),
    v.Sel('& strong, & b', v.tw`bold`),
    v.Sel('& p', v.mt`1em`),
    el.ref(dom => { ref.dom = dom; ref.update(); })
  )
});
