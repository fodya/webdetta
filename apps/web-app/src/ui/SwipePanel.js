import { el, h, v, throttle, Component } from '#tk';
import { inspect } from '../lib/vendetta/index.js';
import { swipeHook } from './utils.js';

const positions = (p0) => ({
  left: (opened, st) => ({
    transform: `translateX(${
      opened
      ? `${!st ? p0 : Math.min(p0 + st.x1 - st.x0, 0)}px`
      : 'calc(-100% - 48px)'
    })`
  }),
  right: (opened, st) => ({
    transform: `translateX(${
      opened
      ? `${!st ? p0 : Math.max(p0 + st.x1 - st.x0, 0)}px`
      : 'calc(100% + 48px)'
    })`
  }),
  bottom: (opened, st) => ({
    transform: `translateY(${
      opened
      ? `${!st ? p0 : Math.max(p0 + st.y1 - st.y0, 0)}px`
      : 'calc(100% + 48px)'
    })`
  }),
  top: (opened, st) => ({
    transform: `translateY(${
      opened
      ? `${!st ? p0 : Math.min(p0 + st.y1 - st.y0, 0)}px`
      : 'calc(-100% - 48px)'
    })`
  })
});

const closeThresholds = {}
closeThresholds.left = closeThresholds.right = (st, r) => {
  const d = Math.abs(st.x1 - st.x0);
  return d + Math.abs(st.speedX) * r.width / 6 >= r.width / 2
}
closeThresholds.top = closeThresholds.bottom = (st, r) => {
  const d = Math.abs(st.y1 - st.y0);
  return d + Math.abs(st.speedY) * r.height / 6 >= r.height / 2
}

const SwipePanel = Component(({
  ref,
  autoopen,
  offset,
  direction,
  duration=250,
  backdrop,
  onOpen,
  onClose
}, ...content) => {
  const pos = positions(offset)[direction];
  const closeThreshold = closeThresholds[direction];
  
  const dom = h.ref();
  const [opened, setOpened] = h.val();
  
  const open = () => !opened && (onOpen?.(), setOpened(true));
  const close = () => opened && (onClose?.(), setOpened(false));
  ref?.({ open, close });
  
  const updateStyle = h.ref()(() => {
    if (!dom()) return;
    dom().style.transition = '250ms ease transform';
    Object.assign(dom().style, pos(opened));
  });
  h.effect([opened], updateStyle);
  h.effect([autoopen], () => {
    if (autoopen && !opened) open();
  });
  
  return el.Div(v.w`f`.h`100vh`.fix().z(2).i`0`,
    el.ref(v => { dom(v); updateStyle(); }),
    v.Inline({ willChange: 'transform' }),
    swipeHook((ev, st) => {
      const r = dom().getBoundingClientRect();
      if (ev == 'start' || ev == 'move') {
        dom().style.transitionDuration = '0ms';
        Object.assign(dom().style, pos(true, st));
      }
      if (ev == 'end') {
        dom().style.transitionDuration = duration + 'ms';
        if (closeThreshold(st, r)) close();
        else Object.assign(dom().style, pos(true));
      }
    }),
    backdrop && el.Div(
      v.w.h`1000vh`.bg`black`.op`.3`.z`0`.tr`-50% -50%`.d(opened ? 'b' : 'n'),
      el.on.touchstart.pointerdown.touchend.touchmove.pointerup(e => {
        e.stopPropagation();
      }),
      el.on.pointerdown(() => close())
    ),
    content
  );
});

export default SwipePanel;
