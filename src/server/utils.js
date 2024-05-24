export const handleUncaught = ({ exception, rejection }={}) => {
  process.on('uncaughtException', exception ?? ((err, reason) =>
    console.log('Uncaught exception:', err, '\nReason:', reason)
  ));

  process.on('unhandledRejection', rejection ?? ((promise, reason) =>
    console.log('Unhandled rejection:', promise, '\nReason:', reason)
  ));
}
