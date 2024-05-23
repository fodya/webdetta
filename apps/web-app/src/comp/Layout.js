import { el, h, v, Component } from '#tk';
import { Icon, Input } from '#ui';
import { routes, router, currentRoute } from '#pages';

import * as tg from '#feat/telegram.js';
import * as cart from '#feat/cart.js';
  
const Menu = Component(() => {
  const cartCount = cart.entries().reduce((r, a) => r + a[1], 0);

  const Item = (text, icon, routes_) => {
    const curr = currentRoute();
    const active = routes_.includes(curr.route);
    return el.Div(v.col('c', 't').flex`1`.rigid().ptr(),
      v.Transition('.35s ease', v
        .tc(active ? 't1' : 't2')
        .op(active ? 1 : .8)
      ),
      el.on.pointerdown(() => router.navigate(routes_[0])),
      el.Div(v.rel(),
        Icon(icon, 'C', 24),
        (icon == 'cart' && cartCount > 0) &&
        el.Div(v.row`c c`.abs().it.ir`0`.w.h.r`2`.tc`t1`.tr`1.75 -.5`.ts`xs`,
          cartCount
        )
      ),
      el.Div(v.ts`xs`.tt`u`, text),
    );
  }
  
  return el.Div(v.fix().ib`-1px`.w`f`.z`4`.brt`l1`,
    /*header && el.Div(v.row('c', 'c').mb`-4px`,
      Icon('corner-inner-round', 'w', 24)(v.rotZ(-90).mr`-1px`),
      el.Span(v.ph`2`.rtl.rtr`1`.bg`w`.mnw`10`.ta`c`.tt`u`.ts`sm`.tc`t2`, header),
      Icon('corner-inner-round', 'w', 24)(v.ml`-1px`),
    ),*/
    el.Div(v.w`f`.row`ar c`.pv`1`.bg`w`,
      Item('О магазине', 'store', [routes.about]),
      Item('Каталог', 'bars', [routes.main, routes.category]),
      Item('Корзина', 'cart', [routes.cart])
    ),
  );
});

const SearchInput = ({ opened, setOpened, onSearch }) => {
  const [search, setSearch_] = h.val();
  const setSearch = h.throttle(500, val => (setSearch_(val), onSearch(val)));
  
  const inputRef = h.ref();
  const focusInput = h.throttle(200, () => {
    const elem = inputRef();
    if (elem.getBoundingClientRect().y >= 0) elem.focus();
  });
  h.effect([opened], () => {
    if (opened) focusInput();
  });
  
  const prevViewportHeight = h.ref(window.visualViewport.height);
  h.event(window.visualViewport, ['resize'], h.throttle(200, () => {
    const h = window.visualViewport.height, el = document.activeElement;
    if (h - 50 > prevViewportHeight() && el == inputRef()) {
      el.blur();
    }
    prevViewportHeight(h);
  }));
  
  let t = +new Date();
  return el.Div(v.w`f`.h`6`.rigid().d(onSearch ? 'f' : 'n'),
    el.Div(v.ph`2`.w`f`.z`4`,
      opened && [
        v.fix().mt`.5`,
        v.Animation('.25s ease forwards', {
          0: v.it`3`.op`0`,
          100: v.it`5.5`.op`1`
        })
      ],
      Input.Search('Поиск по каталогу', [search, setSearch], {
        inputProps: [
          el.on.blur.focusout(() => (+new Date() - t) > 300 && setOpened(false)),
          el.ref(inputRef)
        ]
      })
    )
  );
}

export default Component(({ ref }, ...content) => {
  const [{
    header=null,
    onSearch=null,
    menu=false,
    back=true,
    mainButton,
    panels
  }, setParams] = h.val({});
  
  ref({ setParams, scrollContainer: () => scrollContainer() });
  
  h.effect([back, mainButton], () => {
    tg.headerColor('#ffffff');
    tg.expand();
    if (back) tg.backButton(true, () => router.go(-1));
    else tg.backButton(false);
    
    if (mainButton) tg.mainButton(...mainButton);
    else tg.mainButton(null);
  });
  
  const { route, params } = currentRoute();
  
  const [scrolledDown, setScrolledDown] = h.val(false);
  const [searchOpened, setSearchOpened] = [
    !!params._s,
    v => (!!params._s != v) && router.navigate(route, {...params, _s: v?1:null})
  ];
  
  const contentRef = h.ref()(content);
  const scrollContainer = h.ref();
  const savedScrollPos = h.ref({})();
  h.effect([route], () => {
    if (!scrollContainer()) return;
    scrollContainer().scrollTop = savedScrollPos[route];
  });
  
  const pad = {
    menu: menu ? 56 : 0,
    header: header ? 48 : 0
  };
  
  const Header = () => el.Div(v.col().gap`1`.fix().it`-1px`.w`f`.bg`w`.z`3`
      .ph`2`.pv`1.5`.mb`-2`.rigid().ov`h`.d(header ? 'f' : 'n'),
    v.Transition('.15s ease', v.h(6)),
    el.Div(v.row`bw c`.w`f`.bg`w`.z`1`,
      el.Span(v.ts`lg`.tw`bold`, header),
      (onSearch && scrolledDown) && el.Div(el.key`x`,
        v.p`1`.mr.mv`-1`.ptr(),
        el.on.pointerdown(e => setSearchOpened(!searchOpened)),
        searchOpened
        ? el.Div()/*Icon('angle-up', 't1', 22)*/
        : Icon('search', 't2', 22)
      ),
    )
  );
  
  return el.Div(
    v.Sel('& ::selection', v.bg`layout.selection`.tc`t0`),
    el.on.contextmenu((e) => { e.preventDefault(); }),
    Menu()(v.d(menu ? 'f' : 'n')),
    Header(),
    (mainButton && tg.isDebug()) && el.Div(
      v.row`c c`.fix().ib`0`.z`4`.w`f`.h`6.5`.ptr().bg`c1`.tc`w`,
      el.key('mainbtn'),
      el.on.click(mainButton[1]),
      mainButton[0]
    ),
    panels && el.Div(v.fix().z(10), el.key('panels'), panels),
    el.Div(
      v.fix().col().w`f`.ts`md`.pb`8`.gap`2`.w`f`.bg`w`.sel`n`.ov('h','a').z`2`,
      v.Inline(v.h(`100vh`).pt(pad.header+'px').pb(pad.menu+'px')),
      el.ref(scrollContainer),
      el.on.scroll(e => {
        if (currentRoute().route == route)
          savedScrollPos[route] = e.target.scrollTop;
        const down = e.target.scrollTop >= 56;
        if (down == scrolledDown) return;
        setScrolledDown(down);
        if (!down) setSearchOpened(false);
      }),
      SearchInput({
        onSearch,
        opened: searchOpened,
        setOpened: setSearchOpened
      }),
      el.Div(v.fix().w`f`.bg`w`.it(pad.header-1+'px').z`2`,
        v.Transition('.2s ease', v
          .h((searchOpened ? 56 : 1) + 'px')
          .brb(scrolledDown ? `l1` : 'T'))
      ),
      el.Div(
        el.ref(dom => (dom && Component.mount(dom, contentRef)))
      )
    )
  );
});
