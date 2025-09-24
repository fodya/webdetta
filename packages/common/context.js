export const Context = (initialValue) => {
  let value = initialValue;
  const context = () => value;
  const run = context.run = function (data, func, ...args) {
    const prev = value;
    value = data;
    try { return func.apply(this, args); }
    finally { value = prev; }
  }
  context.bind = (data, func) => function (...args) {
    return run.call(this, data, func, ...args)
  }
  return context;
};
