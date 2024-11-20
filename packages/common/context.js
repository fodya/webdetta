export const Context = () => {
  let value;
  const context = () => value;
  context.run = function (data, func, ...args) {
    const prev = value;
    value = data;
    let res; try { res = func.apply(this, args); }
    catch (e) { console.error(e); }
    value = prev;
    return res;
  }
  return context;
};
