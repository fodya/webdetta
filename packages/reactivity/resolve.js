import { isAsyncFunction, isAsyncIterable } from '../common/utils.js';
import { currentEffect } from './base.js';

const resolveAsyncIterable = async (effect, value, {
  isActive,
  onLoading,
  onError,
  onValue,
}) => {
  onLoading(true);
  const iterator = value[Symbol.asyncIterator]();
  try {
    while (true) {
      if (!isActive()) break;
      const { value, done } = await currentEffect.run(effect, () => iterator.next());
      if (done || !isActive()) break;
      onValue(value);
    }
  } catch (err) {
    onError(err);
  }
};

export const resolveResource = (effect, func, { onLoading, onError, onValue }) => {
  let active = true;
  const isActive = () => active;
  const destroy = () => active = false;

  if (isAsyncFunction(func)) {
    throw new Error('Async functions are not supported, use async generators instead');
  }
  try {
    const res = func();
    if (isAsyncIterable(res)) {
      resolveAsyncIterable(effect, res, { isActive, onLoading, onError, onValue });
    }
    else {
      onValue(res);
    }
  }
  catch (err) {
    onError(err);
  }

  return { destroy };
}