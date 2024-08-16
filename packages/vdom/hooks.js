import {hook, operator} from './operators.js';
import {Val, Effect, appendToComponent} from './comp.js';

export const val = Val;
export const ref = (initial) => {
  const [st] = val({ ref: initial });
  return (...a) => a.length ? (st.ref = a[0]) : st.ref;
}
export const prop = (obj, ...keys) => {
  const refresh = redraw();
  const val = keys.reduce((acc, k) => acc[k], obj);
  const setVal = val => {
    const target = keys.slice(0, -1).reduce((acc, k) => acc[k], obj);
    target[keys.at(-1)] = val;
    refresh();
  }
  return [val, setVal];
}

const compareArgs = (prev, curr) =>
  !prev
  || prev.length != curr.length
  || prev.some((v, i) => v != curr[i]);

export const effect = (args, func) => {
  const ef = Effect(args, func);
  if (compareArgs(ef.args, args)) ef.perform();
  appendToComponent(hook.destroy(ef.cancel));
}

export const redraw = () => {
  let refresh;
  appendToComponent(operator((_, ctx) => (refresh = ctx.refresh)));
  return () => refresh?.();
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

export const loader = (args, func) => {
  const [value, setValue] = val();

  const then = ref();
  const [load, status_] = status(() => Promise.resolve(func()).then(then()));
  effect(args, () => {
    let cancelled;
    then(res => { if (!cancelled) setValue(res); });
    load();
    return () => { cancelled = true; }
  });

  return [value, load, status_, setValue];
}

export const event = (target, events, handler) => {
  const savedHandler = ref(); savedHandler(handler);
  const [listener] = val(function() {
    return savedHandler().apply(this, arguments);
  });
  effect([target, events, listener], () => {
    events.forEach(ev => target.addEventListener(ev, listener));
    return () => events.forEach(ev => target.removeEventListener(ev, listener));
  });
}
