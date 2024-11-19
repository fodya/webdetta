// MIT License
// (c) 2015­-2023 Michael Lazarev
// Source: https://github.com/frameorc/frameorc/blob/github/src/state/base.js

export async function State({ read, write, interval = 5000 }) {
  let promise, resolve, to, scheduledTime = Infinity;
  function save(after = interval) {
    promise ??= new Promise(ok => resolve = ok)
      .then(() => write(self))
      .finally(() => {
        promise = undefined;
        scheduledTime = Infinity;
      });

    let when = Date.now() + after;
    if (!(when >= scheduledTime)) {
      clearTimeout(to);
      to = setTimeout(resolve, after);
      scheduledTime = when;
    }

    return promise;
  }

  let self = { save, data: undefined };
  await read(self);
  return self;
}
