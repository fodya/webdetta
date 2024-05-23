import { Router, Component } from '#tk';
import { Layout } from '#comp';

import Main from './Main.js';
import Category from './Category.js';
import Product from './Product.js';
import About from './About.js';
import Cart from './Cart.js';

export const router = Router.hashRouter();
const { routes, currentPage, currentRoute } = Router.Pages(router, {
  main: ['/', Main],
  category: ['/category/:id', Category],
  product: ['/product/:id', Product],
  about: ['/about', About],
  cart: ['/cart', Cart],
});

let layoutRef;
const layout = {
  set: v => layoutRef.setParams(v),
  scrollContainer: () => layoutRef.scrollContainer(),
  mount: elem => Component.mount(elem, () => Layout({
    ref: v => { layoutRef = v; }
  }, currentPage))
}

export { layout, routes, currentRoute };
