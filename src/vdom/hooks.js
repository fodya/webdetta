import {hook, operator} from './operators.js';
import {Val, Effect, appendToComponent} from './comp.js';

export const val = Val;
export const ref = (initial) => {
  const [st] = val({ ref: initial });
  return (...a) => a.length ? (st.ref = a[0]) : st.ref;
}

const compareArgs = (prev, curr) =>
  !prev
  || prev.length != curr.length
  || prev.some((v, i) => v != curr[i]);

export const effect = (args, func) => {
  const ef = Effect(args, func);
  ef.prevArgs ??= null;
  if (compareArgs(ef.prevArgs, ef.args)) {
    ef.prevArgs = ef.args;
    ef.perform();
  }
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

export const loader = (initial, args, func) => {
  const [value, setValue] = val(initial);
  const [load, status_] = status(
    () => Promise.resolve(func()).then(res => setValue(res))
  );
  effect(args, () => { load(); });
  return [value, load, status_];
}

export const event = (target, events, handler) =>
  effect([target, events, handler], () => {
    events.forEach(ev => target.addEventListener(ev, handler));
    return () => events.forEach(ev => target.removeEventListener(ev, handler));
  });
