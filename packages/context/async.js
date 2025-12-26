import { AsyncLocalStorage } from 'node:async_hooks';

export const AsyncContext = (initialValue) => {
  const asyncVar = new AsyncLocalStorage();

  const context = () => {
    const state = asyncVar.getStore();
    return state ? state.value : initialValue;
  }
  const run = context.run = function (data, func, ...args) {
    const state = { value: data };
    return asyncVar.run(state, () => func.apply(this, args));
  }
  context.bind = (data, func) => function (...args) {
    return run.call(this, data, func, ...args)
  }

  return context;
};
