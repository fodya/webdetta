import { AsyncLocalStorage } from 'node:async_hooks';

export const Snapshot = () => AsyncLocalStorage.snapshot();

export const AsyncContext = (initialValue) => {
  const storage = new AsyncLocalStorage();

  const context = () => {
    const state = storage.getStore();
    return state ? state.value : initialValue;
  };

  const run = context.run = function (data, func, ...args) {
    const state = { value: data };
    return storage.run(state, () => func.apply(this, args));
  };

  context.bind = (data, func) => function (...args) {
    return run.call(this, data, func, ...args);
  };

  return context;
};

AsyncContext.Snapshot = Snapshot;
