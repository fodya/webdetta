export type UncaughtExceptionHandler = (...args: any[]) => void;
export type UncaughtRejectionHandler = (...args: any[]) => void;

export type UncaughtHandlersArg = {
  exception?: UncaughtExceptionHandler;
  rejection?: UncaughtRejectionHandler;
};

export function handleUncaught(arg?: UncaughtHandlersArg): void;
