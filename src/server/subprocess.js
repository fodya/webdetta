import child_process from 'child_process';

const subprocess = (cmd, args, options) => {
  const proc = child_process.spawn(cmd, args, options);
  
  const instance = {
    proc,
    stdout: handler => {
      if (proc.stdout) && proc.stdout.on('data', handler);
      return instance;
    },
    stderr: handler => {
      if (proc.stdout) && proc.stderr.on('data', handler);
      return instance;
    },
    completion: new Promise((resolve, reject) => {
      proc.on('error', reject)
      proc.on('close', code => {
        if (code === 0) resolve(proc);
        else {
          const err = new Error(`child exited with code ${code}`)
          err.code = code;
          reject(err);
        }
      })
    })
  }
  return instance;
}

export default subprocess;
