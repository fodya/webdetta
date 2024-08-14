export const interceptConsole = (console, interceptor) => {
  const res = {};
  for (const method of Object.keys(console))
    res[method] = (...args) => interceptor(method, args);
  return res;
}
