/**
 * A simple reactivity library for complex UI state
 * @example ./examples/index.example.js
 * @module
 */
import { isAsyncIterable, isPromise } from "@webdetta/common/checks";
import { currentEffect } from "./base.js";

/**
 * @typedef {import("./base.js").Effect} Effect
 */

/**
 * @template T
 * @typedef {Object} TaskHandlers
 * @property {(value: boolean) => void} onLoading
 * @property {(err: unknown) => void} onError
 * @property {(value: T) => void} onValue
 */

/**
 * @template T
 * @typedef {TaskHandlers<T> & { effect?: Effect }} TaskOptions
 */

const runAsyncIterable = async (
  effect,
  iterable,
  { isActive, onLoading, onError, onValue },
) => {
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

const runPromise = async (
  promise,
  { isActive, onLoading, onError, onValue },
) => {
  onLoading(true);
  try {
    const value = await promise;
    if (!isActive()) return;
    onValue(value);
  } catch (err) {
    if (isActive()) onError(err);
  }
};

/**
 * @template T
 * @param {() => T | Promise<T> | AsyncIterable<T>} producer
 * @param {TaskOptions<T>} options
 * @returns {{ destroy(): void }}
 */
export const Task = (producer, { effect, onLoading, onError, onValue }) => {
  let active = true;
  const isActive = () => active;
  const destroy = () => {
    active = false;
  };
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
