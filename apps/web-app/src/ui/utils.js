import { el, h, throttle } from '#tk';

export const swipeHook = handler => {
  const st = h.ref({
    start: null, move: null, end: null,
    x0: 0, y0: 0,
    x1: 0, y1: 0,
    speedX: 0, speedY: 0
  })();
  const process = e => {
    e.preventDefault();
    const p =
      e.changedTouches ? e.changedTouches[0] :
      e.touches ? e.touches[0] :
      e;
    const t = performance.now();
    st.speedX = !st.move ? 0 : (p.clientX - st.x1) / (t - st.move);
    st.speedY = !st.move ? 0 : (p.clientY - st.y1) / (t - st.move);
    st.x1 = p.clientX;
    st.y1 = p.clientY;
    st.move = t;
  }

  const fire = ev => handler(ev, st);
  
  const leaveHandler = h.ref(throttle(() => {
    if (!st.move) return;
    st.start = null;
    st.move = null;
    st.end = null;
    fire('end');
  }))();
  h.event(document, ['mouseleave'], leaveHandler);
  
  return el.on
    .touchstart.pointerdown(throttle(e => {
      process(e);
      st.x0 = st.x1;
      st.y0 = st.y1;
      st.start = st.move;
      st.end = null;
      fire('start');
    }))
    .touchmove.poinermove.mousemove(throttle(e => {
      if (!st.start) return;
      process(e);
      fire('move');
    }))
    .touchend.pointerup(throttle(e => {
      const { speedX, speedY } = {...st};
      process(e);
      st.end = st.move;
      st.move = null;
      st.start = null;
      st.speedX = speedX;
      st.speedY = speedY;
      fire('end');
    }))
}
