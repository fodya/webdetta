import child_process from 'child_process';

export const handleUncaught = ({ exception, rejection }) => {
  process.on('uncaughtException', exception ?? ((err, reason) =>
    console.log('Uncaught exception:', err, '\nReason:', reason)
  ));

  process.on('unhandledRejection', rejection ?? ((promise, reason) =>
    console.log('Unhandled rejection:', promise, '\nReason:', reason)
  ));
}

export const subprocess = (cmd, args, params) => {
  const { onData, onError, options } = params;
  const proc = child_process.spawn(cmd, args, options);
  
  if (onData && process.stdout) process.stdout.on('data', onData);
  if (onError && process.stderr) process.stderr.on('data', onError);
  
  const promise = new Promise((resolve, reject) => {
    proc.on('error', reject)
    proc.on('close', code => {
      if (code === 0) resolve(proc);
      else {
        const err = new Error(`child exited with code ${code}`)
        err.code = code;
        err.process = process;
        reject(err);
      }
    })
  })
  promise.process = process;
  return promise;
}
