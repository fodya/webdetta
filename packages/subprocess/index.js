import child_process from 'child_process';

export default (...argv) => {
  let options = {};
  if (typeof argv.at(-1) == 'object' && argv.at(-1) !== null) {
    options = argv.at(-1);
    argv = argv.slice(0, -1);
  }

  const proc = child_process.spawn(argv[0], argv.slice(1), options);
  const proxy = new Proxy(new Promise((resolve, reject) => {
    proc.on('error', reject)
    proc.on('close', code =>
      code === 0
      ? resolve(proc)
      : reject(Object.assign(
        new Error(`child exited with code ${code}`),
        { code }
      ))
    )
  }), {
    get: (target, key) => {
      if (key in proc) return proc[key];
      const val = target[key];
      return typeof val == 'function' ? val.bind(target) : val;
    }
  });

  return proxy;
}
