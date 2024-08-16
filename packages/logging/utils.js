export const interceptConsole = (console, interceptors) => {
  const res = {};
  for (const method of Object.keys(console)) {
    if (!(method in interceptors))
      res[method] = console[method];
    else
      res[method] = (...args) => interceptors[method].apply(console, args);
  }
  return res;
}
