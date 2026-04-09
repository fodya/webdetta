import { isClientRuntime } from './environment.js';

const handlers = {
  initialized: false,
  exception: null,
  rejection: null
}

const handleUncaughtClient = ({ exception, rejection } = {}) => {
  handlers.exception = exception ?? ((message, url, lineNumber) => {
    console.error('Uncaught exception:', message + ';' + url + ';' + lineNumber);
  });
  handlers.rejection = rejection ?? ((error) => {
    console.error('Unhandled rejection:', error.reason);
  });

  if (!handlers.initialized) {
    handlers.initialized = true;
    const globalObj = typeof globalThis.window !== 'undefined' ? globalThis.window : globalThis.self;
    globalObj.addEventListener('error', (...a) => handlers.exception(...a));
    globalObj.addEventListener('unhandledrejection', (...a) => handlers.rejection(...a));
  }
}

const handleUncaughtServer = ({ exception, rejection } = {}) => {
  handlers.exception = exception ?? ((error, reason) =>
    console.error('Uncaught exception:', error, '\nReason:', reason)
  );
  handlers.rejection = rejection ?? ((promise, reason) =>
    console.error('Unhandled rejection:', promise, '\nReason:', reason)
  );

  if (!handlers.initialized) {
    handlers.initialized = true;
    process.on('uncaughtException', (...a) => handlers.exception(...a));
    process.on('unhandledRejection', (...a) => handlers.rejection(...a));
  }
}

export const handleUncaught = arg => {
  if (isClientRuntime) {
    handleUncaughtClient(arg);
  } else {
    handleUncaughtServer(arg);
  }
}

handleUncaught();