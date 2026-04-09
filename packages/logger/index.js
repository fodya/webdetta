import { isServerRuntime } from "../common/environment.js";

const createContext = isServerRuntime
  ? await import("../context/async.js").then(d => d.AsyncContext)
  : await import("../context/sync.js").then(d => d.Context);

const loggerContext = createContext(globalThis.console);
const formatterContext = createContext();

const nestedFormatter = (parentFormatter, formatter) => (args, originalArgs) => {
  const handle = { stopPropagation: false };
  args = formatter.call(handle, args, originalArgs);
  if (handle.stopPropagation) return args;
  return parentFormatter(args, originalArgs);
}

export const withLogger = (logger, func) => loggerContext.run(logger, func);
export const withLoggerFormatter = (formatter, func) => {
  const parent = formatterContext();
  if (parent) formatter = nestedFormatter(parent, formatter);
  return formatterContext.run(formatter, func);
}

const exec = (method, args) => {
  const logger = loggerContext();
  if (!logger) throw new Error('Logger is not defined in current context');
  const formatter = formatterContext();
  if (formatter) args = formatter(args, args);
  logger[method]?.(...args);
}

export const logger = {
  log() { return exec('log', arguments); },
  info() { return exec('info', arguments); },
  warn() { return exec('warn', arguments); },
  error() { return exec('error', arguments); },
  debug() { return exec('debug', arguments); },
  trace() { return exec('trace', arguments); },
}