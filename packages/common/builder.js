// Modified version of
// https://github.com/frameorc/frameorc/blob/github/src/builder.js
// Original author: Michael Lazarev

import { objectHasOwn } from './utils.js';

export const Builder = (effect, tasks=[], names=[]) => {
  const call = (...args) => args[0] === Builder.symbol
    ? (args[0] = tasks, effect(...args))
    : Builder(effect, [...tasks, { names, args }], []);
  const get = (_, k) => typeof k === 'symbol'
    ? effect[k]
    : Builder(effect, tasks, [...names, k]);
  call[Builder.symbol] = true;
  return new Proxy(call, { get })
}

Builder.symbol = Symbol('Builder.symbol');
Builder.isBuilder = (f) => f && objectHasOwn(f, Builder.symbol);
Builder.launch = (f, ...args) => f(Builder.symbol, ...args);

export default Builder;
