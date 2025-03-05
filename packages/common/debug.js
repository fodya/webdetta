const linkOriginalFunction = (func, wrapped) => {
  const entry = wrapped[debug.symbol] ??= {};
  entry.originalFunction = func[debug.symbol]?.original ?? func;
  (entry.functionWrappers ??= []).push(func);

  return wrapped;
}

export const debug = {
  symbol: Symbol('DEBUG'),
  enable: () => {
    debug.linkOriginalFunction = linkOriginalFunction;
  },
  linkOriginalFunction: (f, wrapped) => f, // noop
}
