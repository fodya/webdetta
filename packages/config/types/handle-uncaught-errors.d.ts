/**
 * Installs global handlers for uncaught exceptions and unhandled promise
 * rejections, logging them and preventing a Node.js process from exiting on
 * unhandled rejections.
 *
 * @module
 */

/** Handler invoked for uncaught synchronous exceptions. */
export type UncaughtExceptionHandler = (...args: any[]) => void;
/** Handler invoked for unhandled promise rejections. */
export type UncaughtRejectionHandler = (...args: any[]) => void;

/** Optional overrides for the default exception and rejection handlers. */
export type UncaughtHandlersArg = {
  exception?: UncaughtExceptionHandler;
  rejection?: UncaughtRejectionHandler;
};

/** Installs global uncaught-error handlers. Safe to call multiple times. */
export function handleUncaught(arg?: UncaughtHandlersArg): void;
