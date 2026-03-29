// Modified version of
// https://github.com/frameorc/frameorc/blob/github/src/builder.js
// Original author: Michael Lazarev

import { objectHasOwn } from '../common/object.js';

export const Builder = (effect, tasks=[], names=[]) => {
  const call = (...args) => {
    if (args[0] === Builder.symbol) return (args[0] = tasks, effect(...args));
    return Builder(effect, [...tasks, { names, args }], []);
  }
  const get = (_, k) => {
    if (typeof k === 'symbol') return effect[k];
    return Builder(effect, tasks, [...names, k]);
  }
  call[Builder.symbol] = true;
  return new Proxy(call, { get })
}

Builder.symbol = Symbol('Builder.symbol');
Builder.isBuilder = (f) => f && objectHasOwn(f, Builder.symbol);
Builder.launch = (f, ...args) => f(Builder.symbol, ...args);
