// MIT License
// (c) 2015­-2023 Michael Lazarev
// Source: https://github.com/frameorc/frameorc/blob/github/src/chain.js

const ORIGINAL = Symbol();

export function inOrder(f) {
  let result = (next, ...args) => { f(...args); next(...args); };
  result[ORIGINAL] = f;
  return result;
}

export function postOrder(f) {
  let result = (next, ...args) => { next(...args); f(...args); };
  result[ORIGINAL] = f;
  return result;
}

export function Chain() {
  let handlersMap = new Map(), handlers;
  function makeNext(hs, pos=0) {
    hs ??= handlers ??= Array.from(handlersMap.values());
    return (...args) => hs[pos]?.(makeNext(hs, pos+1), ...args);
  }
  let trigger = (...args) => makeNext()(...args);
  const change = func => (...hs) => {
    for (let h of hs) func(h);
    handlers = undefined;
    return trigger;
  };
  return Object.assign(trigger, {
    [Chain.symbol]: true,
    on: change(h => handlersMap.set(h, inOrder(h))),
    add: change(h => handlersMap.set(h[ORIGINAL] ?? h, h)),
    delete: change(h => handlersMap.delete(h[ORIGINAL] ?? h)),
  });
}

Chain.symbol = Symbol('Chain.symbol');

export function isBuilder(f) {
  return Object.hasOwn(f, Chain.symbol);
}

export function rVal(v) {
  return Chain().add((next, ...args) => {
    if (args.length > 0) next(v = (args.length === 1) ? args[0] : args);
    return v;
  });
}

export function rRef(obj, name) {
  return Chain().add((next, ...args) => {
    if (args.length > 0) next(obj[name] = (args.length === 1) ? args[0] : args);
    return obj[name];
  });
}

