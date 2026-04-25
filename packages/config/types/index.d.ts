/**
 * Runtime configuration side-effects.
 *
 * @example
 * ```js
 * import '@webdetta/core/config/enable-polyfills';
 * import { handleUncaught } from '@webdetta/core/config/handle-uncaught-errors';
 * import { withLogger, logger } from '@webdetta/core/logger';
 *
 * withLogger(console, () => {
 *   handleUncaught({
 *     exception: (event) => logger.error('uncaught', event),
 *     rejection: (event) => logger.error('unhandled-rejection', event),
 *   });
 *   logger.info('global error handlers installed once at startup');
 * });
 * ```
 */
export * from './handle-uncaught-errors.d.ts';
