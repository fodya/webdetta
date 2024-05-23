import {hook, operator, throttle as throttle_} from '../frameorc/dom.js';
import {Val, applyOperator} from '../frameorc/comp.js';

export const ref = (initial) => { 
  const [st] = val({ ref: initial });
  return (...a) => {
    if (a.length) return (st.ref = a[0]);
    else return st.ref;
  }
}

export const val = Val;

const compareArgs = (prev, curr) =>
  !prev
  || prev.length != curr.length
  || prev.some((v, i) => v != curr[i]);

export const effect = (args, func) => {
  const st = ref({ prev: null, cleanup: null })();
  if (compareArgs(st.prev, args)) {
    st.prev = args;
    st.cleanup?.();
    st.cleanup = func();
  }
  
  const destroy = throttle_(() => st?.cleanup?.());
  
  applyOperator(hook.destroy(destroy));
}

export const redraw = () => {
  const st = ref({ f: null });
  applyOperator(operator((_, ctx) => { st.f = ctx.root.refresh; }));
  return () => st.f();
}

export const memo = (args, func) => {
  const st = ref({ prev: null, save: null })();
  if (compareArgs(st.prev, args)) {
    st.prev = args;
    st.save = func();
  }
  return st.save;
}

export const status = (func) => {
  const [status, setStatus] = val({ loading: false, error: null });
  const load = async (...args) => {
    let res;
    setStatus({ loading: true, error: null });
    try {
      res = await func(...args);
      setStatus({ loading: false, error: null });
    } catch (err) {
      setStatus({ loading: false, error: err });
      console.error(err);
    }
    return res;
  };
  return [load, status];
}

export const loader = (initial, args, func) => {
  const [value, setValue] = val(initial);
  const [load, status_] = status(
    () => Promise.resolve(func()).then(res => setValue(res))
  );
  effect(args, () => { load(); });
  return [value, load, status_];
}

export const throttle = (delay, func) => {
  const r = ref({})();
  r.f = (...args) => {
    clearTimeout(r.t);
    r.args = args;
    r.t = setTimeout(() => func(...r.args), delay);
  }
  return r.f;
}

export const event = (target, events, handler) => effect([], () => {
  events.forEach(ev => target.addEventListener(ev, handler));
  return () => events.forEach(ev => target.removeEventListener(ev, handler));
});
