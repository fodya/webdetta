import { isTemplateCall, throttle } from '../common/func.js';

let currentOwner;
let currentHandler;
export const getCurrentHandler = () => currentHandler;

export const Signal = ({ handlers, get, set }) => {
  const accessor = (...a) => {
    if (a.length === 0) {
      if (handlers && currentHandler) handlers.add(currentHandler);
      return get();
    } else {
      const val = set(a[0]);
      if (handlers) for (const handler of handlers) handler(val);
      return val;
    }
  }
  return (accessor[Signal.symbol] = true, accessor);
}
Signal.symbol = Symbol('Signal.symbol');
Signal.isSignal = f => f && Object.hasOwn(f, Signal.symbol);

const Value = val => Signal({
  handlers: new Set(),
  get: () => val,
  set: v => val = v
});
const Reference = (target, key) => Signal({
  handlers: null,
  get: () => target()[key],
  set: v => target()[key] = v
});

const effect = (func, owner=currentOwner, listen=true) => {
  const run = handler => runWithOwner(owner, handler, func, null, [owner]);
  return run(listen ? run.bind(null, null) : null);
}
const derive = func => {
  const value = Value();
  effect(() => value(func()));
  return value;
}

const runWithOwner = (owner, handler, func, thisArg, args) => {
  const [pOwner, pHandler] = [currentOwner, currentHandler];
  [currentOwner, currentHandler] = [owner, handler];
  let res; try { res = func.apply(thisArg, args); }
  catch (e) { console.error(e); }
  [currentOwner, currentHandler] = [pOwner, pHandler];
  return res;
}

export const r = {
  val: Value,
  ref: Reference,
  derive: derive,
  effect: effect
}
