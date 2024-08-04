import jsenv from './jsenv.js';

const handleUncaughtClient = ({ exception, rejection }={}) => {
  window.addEventListener('error', exception ?? ((msg, url, num) => {
    console.log('Uncaught exception:', msg + ';' + url + ';' + num);
    return true;
  }));

  window.addEventListener('unhandledrejection', rejection ?? ((e) => {
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
  (jsenv == 'browser' ? handleUncaughtClient : handleUncaughtServer)(arg);
