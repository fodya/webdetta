// MIT License
// (c) 2015­-2023 Michael Lazarev
// Source: https://github.com/frameorc/frameorc/blob/github/src/builder.js

export function isBuilder(f) {
  return Object.hasOwn(f, Builder.symbol);
}

function builder(f) {
  f[Builder.symbol] = true;
  if (Builder.enableInspect) Object.defineProperty(f, Builder.inspect, {
    get() { return f(Builder.inspect); }
  });
  return f;
}

export function Builder(effect, tasks=[], names=[]) {
  return new Proxy(builder((...args) =>
    args[0] === Builder.inspect
    ? [...tasks, { names, args: [] }] :
    args[0] === Builder.symbol
    ? effect(
      names.length == 0 ? tasks : [...tasks, { names, args: [] }],
      ...args.slice(1)
    )
    : Builder(effect, [...tasks, { names, args }], [])
  ), {
    get: (target, name) =>
      Builder(effect, tasks, [...names, name])
  });
}
Builder.symbol = Symbol('Builder.symbol');
Builder.inspect = Symbol('Builder.inspect');
Builder.enableInspect = false;
Builder.launch = launch;

export function launch(construct, ...args) {
  return construct(Builder.symbol, ...args);
}
