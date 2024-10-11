// MIT License
// (c) 2015­-2023 Michael Lazarev
// Source: https://github.com/frameorc/frameorc/blob/github/src/rpc/proto.js

import * as msgpack from "@msgpack/msgpack";

const INCLUDE_STACK_TRACE = false;
msgpack.addExtension({
  Class: Error,
  type: 1,
  read: function (e) {
    return e;
  },
  write: function (e) {
    let result = { name: e.name, message: e.message };
    if (INCLUDE_STACK_TRACE) result.stack = e.stack;
    return result;
  },
});
const decode = data => msgpack.decode(new Uint8Array(data));
const encode = msgpack.encode;
export const EMPTY = new UInt8Array(0);

export const processCall = async (methods, ctx, name, args) => {
  let res, err;
  const method = methods[name];
  if (typeof method === "function") {
    try { res = await method.apply(ctx, args); }
    catch (e) { console.error(e); err = e; }
  } else {
    err = new Error('Method "' + name + '" is not defined');
  }
  return [res, err];
}

export class RpcError extends Error {
  constructor(base, ...args) {
    super(...args);
    this.name = "RpcError";
    this.message = base?.message ?? '';
    if (base?.stack) this.stack = "RpcError/" + base.stack;
  }
}

export function Proto(send, getMethods) {
  let handlers = {};
  let counter = 0;
  async function process(ctx, data /* : ArrayBuffer */) {
    try {
      data = decode(data);
      // message ::= { call, from, args } | { to, res|err }
      if ('to' in data) handlers[data.to]?.(data);
      else if ('call' in data && Array.isArray(data.args)) {
        const [res, err] = await processCall(getMethods(), ctx, data.call, data.args);
        if ('from' in data) send(encode({
          to: data.from,
          ...(err ? { err } : { res })
        }));
      }
    } catch (e) {
      console.error(e);
    }
  }
  function call(target, ...args) {
    return new Promise((resolve, reject) => {
      let from = ++counter;
      handlers[from] = (v) => {
        if ('err' in v) reject(new RpcError(v.err));
        else resolve(v.res);
        delete handlers[from];
      };
      send(encode({ call: target, from, args }));
    });
  }
  function cast(target, ...args) {
    return send(encode({ call: target, args }));
  }
  function abort(e) {
    for (let i in handlers) {
      try { handlers[i]({ err: e }); }
      catch (e) { console.error(e); }
    }
  }
  return { process, cast, call, abort };
}
