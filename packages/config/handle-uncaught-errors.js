import { runtime, isClientRuntime } from '../common/environment.js';

const handlers = {
  initialized: false,
  exception: null,
  rejection: null
}

const setup = ({ exception, rejection }, defaults, register) => {
  handlers.exception = exception ?? defaults.exception;
  handlers.rejection = rejection ?? defaults.rejection;
  if (handlers.initialized) return;
  handlers.initialized = true;
  register();
}

const handleUncaughtClient = (arg = {}) => setup(arg, {
  exception: (message, url, lineNumber) =>
    console.error('Uncaught exception:', message + ';' + url + ';' + lineNumber),
  rejection: (error) =>
    console.error('Unhandled rejection:', error.reason)
}, () => {
  const g = typeof globalThis.window !== 'undefined' ? globalThis.window : globalThis.self;
  g.addEventListener('error', (...a) => handlers.exception(...a));
  g.addEventListener('unhandledrejection', (...a) => handlers.rejection(...a));
});

const handleUncaughtDeno = (arg = {}) => setup(arg, {
  exception: (event) => console.error(
    'Uncaught exception:',
    event.error ?? event.message,
    '\nAt:', (event.filename ?? '') + ':' + (event.lineno ?? '') + ':' + (event.colno ?? '')
  ),
  rejection: (event) =>
    console.error('Unhandled rejection:', event.reason)
}, () => {
  globalThis.addEventListener('error', (e) => {
    e.preventDefault?.();
    handlers.exception(e);
  });
  globalThis.addEventListener('unhandledrejection', (e) => {
    e.preventDefault?.();
    handlers.rejection(e);
  });
});

const handleUncaughtOther = (arg = {}) => setup(arg, {
  exception: (error, reason) =>
    console.error('Uncaught exception:', error, '\nReason:', reason),
  rejection: (promise, reason) =>
    console.error('Unhandled rejection:', promise, '\nReason:', reason)
}, () => {
  process.on('uncaughtException', (...a) => handlers.exception(...a));
  process.on('unhandledRejection', (...a) => handlers.rejection(...a));
});

export const handleUncaught = (arg) => {
  if (isClientRuntime) handleUncaughtClient(arg);
  else if (runtime === 'deno') handleUncaughtDeno(arg);
  else handleUncaughtOther(arg);
}

handleUncaught();
