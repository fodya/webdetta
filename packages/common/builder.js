// Modified version of
// https://github.com/frameorc/frameorc/blob/github/src/builder.js
// Original author: Michael Lazarev

export const Builder = (effect, tasks=[], names=[]) => new Proxy(
  (...args) => args[0] === Builder.symbol
    ? (args[0] = tasks, effect(...args))
    : Builder(effect, [...tasks, { names, args }], []), {
  get: (_, k) => typeof k === 'symbol'
    ? effect[k]
    : Builder(effect, tasks, [...names, k])
});

Builder.symbol = Symbol('Builder.symbol');
Builder.isBuilder = (f) => Object.hasOwn(f, Builder.symbol);
Builder.launch = (f, ...args) => f(Builder.symbol, ...args);

export default Builder;
