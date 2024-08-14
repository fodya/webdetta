export const interceptConsole = (console, interceptor) => {
  const res = {};
  for (const method of Object.keys(console)) {
    res[method] = (...args) => {
      const newArgs = interceptor(method, args);
      if (!newArgs) return;
      console[method].apply(console, newArgs);
    }
  }
  return res;
}
