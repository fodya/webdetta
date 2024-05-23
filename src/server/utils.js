export const handleUncaught = (handlers={}) => {
  process.on('uncaughtException', handlers.exception ??= (err, reason) =>
    console.log('Caught exception:', err, '\nReason:', reason)
  );

  process.on('unhandledRejection', handlers.rejection ??= (promise, reason) =>
    console.log('Unhandled rejection:', promise, '\nReason:', reason)
  );
}
