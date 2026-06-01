/**
 * @module
 */
import { isServerRuntime } from "@webdetta/common/environment";

/**
 * @typedef {Object} LoggerLike
 * @property {(...args: unknown[]) => void} [log]
 * @property {(...args: unknown[]) => void} [info]
 * @property {(...args: unknown[]) => void} [warn]
 * @property {(...args: unknown[]) => void} [error]
 * @property {(...args: unknown[]) => void} [debug]
 * @property {(...args: unknown[]) => void} [trace]
 */

/**
 * @typedef {Object} FormatterHandle
 * @property {boolean} stopPropagation
 */

/**
 * @typedef {function(this: FormatterHandle, args: unknown[], originalArgs: unknown[]): unknown[]} Formatter
 */

/**
 * @typedef {Required<LoggerLike>} LoggerMethods
 */

const createContext = isServerRuntime
  ? await import("@webdetta/context/async").then((d) => d.AsyncContext)
  : await import("@webdetta/context/sync").then((d) => d.Context);

const loggerContext = createContext(globalThis.console);
const formatterContext = createContext();

const nestedFormatter =
  (parentFormatter, formatter) => (args, originalArgs) => {
    const handle = { stopPropagation: false };
    args = formatter.call(handle, args, originalArgs);
    if (handle.stopPropagation) return args;
    return parentFormatter(args, originalArgs);
  };

/**
 * @param {LoggerLike} logger
 * @param {() => R} func
 * @template R
 * @returns {R}
 */
export const withLogger = (logger, func) => loggerContext.run(logger, func);

/**
 * @param {function(this: FormatterHandle, args: unknown[], originalArgs: unknown[]): unknown[]} formatter
 * @param {() => R} func
 * @template R
 * @returns {R}
 */
export const withLoggerFormatter = (formatter, func) => {
  const parent = formatterContext();
  if (parent) formatter = nestedFormatter(parent, formatter);
  return formatterContext.run(formatter, func);
};

const exec = (method, args) => {
  const logger = loggerContext();
  if (!logger) throw new Error("Logger is not defined in current context");
  const formatter = formatterContext();
  if (formatter) args = formatter(args, args);
  logger[method]?.(...args);
};

/** @type {LoggerMethods} */
export const logger = {
  log() {
    return exec("log", arguments);
  },
  info() {
    return exec("info", arguments);
  },
  warn() {
    return exec("warn", arguments);
  },
  error() {
    return exec("error", arguments);
  },
  debug() {
    return exec("debug", arguments);
  },
  trace() {
    return exec("trace", arguments);
  },
};
