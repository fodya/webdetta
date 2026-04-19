/**
 * Scoped logger with pluggable underlying loggers and argument formatters.
 *
 * The exported {@link logger} forwards to whatever logger is installed in the
 * current scope via {@link withLogger}. Formatters installed via
 * {@link withLoggerFormatter} run in LIFO order and may short-circuit the chain.
 *
 * @example
 * ```js
 * import { logger, withLogger } from '@webdetta/core/logger';
 *
 * withLogger(console, () => {
 *   logger.info('hello');
 * });
 * ```
 *
 * @module
 */

/** Shape of a pluggable underlying logger; all methods are optional. */
export type LoggerLike = {
  log?(...args: unknown[]): void;
  info?(...args: unknown[]): void;
  warn?(...args: unknown[]): void;
  error?(...args: unknown[]): void;
  debug?(...args: unknown[]): void;
  trace?(...args: unknown[]): void;
};

/** Control object passed as `this` to a {@link Formatter}; set `stopPropagation` to skip outer formatters. */
export type FormatterHandle = { stopPropagation: boolean };

/** Transforms the arguments of a log call before they reach the underlying logger. */
export type Formatter = (
  this: FormatterHandle,
  args: unknown[],
  originalArgs: unknown[]
) => unknown[];

/** Runs `func` with the given underlying `logger` installed in the current scope. */
export function withLogger<R>(logger: LoggerLike, func: () => R): R;
/** Runs `func` with `formatter` added to the current scope's formatter chain. */
export function withLoggerFormatter<R>(formatter: Formatter, func: () => R): R;

/** Logger interface with all standard methods present (no optional keys). */
export type LoggerMethods = Required<LoggerLike>;
/** The ambient logger: delegates to the underlying logger installed via {@link withLogger}. */
export const logger: LoggerMethods;
