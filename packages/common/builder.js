// MIT License
// (c) 2015­-2023 Michael Lazarev
// Source: https://github.com/frameorc/frameorc/blob/github/src/builder.js

export function isBuilder(f) {
  return Object.hasOwn(f, Builder.symbol);
}

function builder(f) {
  f[Builder.symbol] = true;
  return f;
}

const Builder_call = (effect, tasks, names, ...args) => (
  args[0] === Builder.inspect.symbol
  ? [...tasks, { names, args: [] }] :
  args[0] === Builder.symbol
  ? effect(
    names.length == 0 ? tasks : [...tasks, { names, args: [] }],
    ...args.slice(1)
  )
  : Builder(effect, [...tasks, { names, args }], [])
);
const Builder_get = (effect, tasks, names, target, name) => (
  Builder(effect, tasks, [...names, name])
);
export const Builder = (effect, tasks=[], names=[]) => new Proxy(
  builder(Builder_call.bind(effect, tasks, names)),
  { get: Builder_get.bind(effect, tasks, names) }
);
Builder.symbol = Symbol('Builder.symbol');

Builder.inspect = construct => construct(Builder.inspect.symbol);
Builder.inspect.symbol = Symbol('Builder.inspect');

Builder.launch = launch;
export function launch(construct, ...args) {
  return construct(Builder.symbol, ...args);
}
