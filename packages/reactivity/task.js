import { isAsyncIterable, isPromise } from '../common/utils.js';
import { currentEffect } from './base.js';

const runAsyncIterable = async (effect, iterable, { isActive, onLoading, onError, onValue }) => {
  onLoading(true);
  const iterator = iterable[Symbol.asyncIterator]();
  try {
    while (true) {
      if (!isActive()) break;
      const step = await currentEffect.run(effect, () => iterator.next());
      if (step.done || !isActive()) break;
      onValue(step.value);
    }
  } catch (err) {
    if (isActive()) onError(err);
  }
};

const runPromise = async (promise, { isActive, onLoading, onError, onValue }) => {
  onLoading(true);
  try {
    const value = await promise;
    if (!isActive()) return;
    onValue(value);
  } catch (err) {
    if (isActive()) onError(err);
  }
};

export const Task = (producer, { effect, onLoading, onError, onValue }) => {
  let active = true;
  const isActive = () => active;
  const destroy = () => { active = false; };
  const handlers = { isActive, onLoading, onError, onValue };

  try {
    const res = producer();
    if (isAsyncIterable(res)) {
      runAsyncIterable(effect, res, handlers);
    } else if (isPromise(res)) {
      runPromise(res, handlers);
    } else {
      onValue(res);
    }
  } catch (err) {
    onError(err);
  }

  return { destroy };
};
