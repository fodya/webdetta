import { runtime } from './environment.js';
import { isTemplateCall } from './utils.js';
import { isPromise } from './utils.js';

export const err = (...args) => {
  throw (
    isTemplateCall(args)
    ? new Error(String.raw(...args))
    : new Error(...args)
  );
};

export const catchErrors = (f, handler=catchErrors.handler) => {
  return function() {
    try {
      const res = f.apply(this, arguments);
      return isPromise(res) ? res.catch(handler) : res;
    }
    catch (e) {
      handler(e);
    }
  }
}
catchErrors.handler = e => console.error(e);

const handleUncaughtClient = ({ exception, rejection }={}) => {
  globalThis.window.addEventListener('error', exception ?? ((msg, url, num) => {
    console.log('Uncaught exception:', msg + ';' + url + ';' + num);
    return true;
  }));

  globalThis.window.addEventListener('unhandledrejection', rejection ?? ((e) => {
    console.log('Unhandled rejection:', e.reason);
    return true;
  }));
}

const handleUncaughtServer = ({ exception, rejection }={}) => {
  process.on('uncaughtException', exception ?? ((err, reason) =>
    console.log('Uncaught exception:', err, '\nReason:', reason)
  ));

  process.on('unhandledRejection', rejection ?? ((promise, reason) =>
    console.log('Unhandled rejection:', promise, '\nReason:', reason)
  ));
}

export const handleUncaught = (arg) =>
  (runtime == 'browser' ? handleUncaughtClient : handleUncaughtServer)(arg);
