export const Context = (initialValue) => {
  let value = initialValue;
  const context = () => value;
  const run = context.run = function (data, func, ...args) {
    const prev = value;
    value = data;
    let res; try { res = func.apply(this, args); }
    catch (e) { value = prev; throw e; }
    value = prev; return res;
  }
  context.bind = (data, func) => function (...args) {
    return run.call(this, data, func, ...args)
  };
  return context;
};
