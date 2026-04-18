export type LoggerLike = {
  log?(...args: unknown[]): void;
  info?(...args: unknown[]): void;
  warn?(...args: unknown[]): void;
  error?(...args: unknown[]): void;
  debug?(...args: unknown[]): void;
  trace?(...args: unknown[]): void;
};

export type FormatterHandle = { stopPropagation: boolean };

export type Formatter = (
  this: FormatterHandle,
  args: unknown[],
  originalArgs: unknown[]
) => unknown[];

export function withLogger<R>(logger: LoggerLike, func: () => R): R;
export function withLoggerFormatter<R>(formatter: Formatter, func: () => R): R;

export type LoggerMethods = Required<LoggerLike>;
export const logger: LoggerMethods;
