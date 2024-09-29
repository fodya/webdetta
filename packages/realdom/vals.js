import { Chain, Effect } from './chain.js';

let ctx;
class Ctx {
  ns = null

  connect = Chain()
  disconnect = Chain()
  update = null
  parent = null

  constructor(update, parent) {
    this.update = update;
    this.parent = parent;
    if (parent) {
      parent.connect.on(this.connect);
      parent.disconnect.on(this.disconnect);
    }
    this.bind = this.bind.bind(this);
  }

  #chains = new Map()
  attachChain(chain) {
    const update = () => this.update?.();
    let h = this.#chains.get(chain);
    if (!h) this.#chains.set(chain, h = {
      on: () => (update(), chain.on(update)),
      off: () => chain.off(update)
    });
    chain.on(update);
    this.connect.on(h.on);
    this.disconnect.on(h.off);
  }

  bind(func) {
    return (...a) => {
      const prevCtx = ctx;
      ctx = this;

      let result, error;
      try { result = func(...a); }
      catch (e) { error = e; }

      ctx = prevCtx;
      if (error) { throw error; }
      else return result;
    }
  }
}

const signal = (accessor) => {
  const chain = Chain(
    Effect(() => { if (ctx) ctx.attachChain(chain); }),
    accessor
  );
  return chain;
}

const val = v => signal((next, ...args) => (
  args.length == 0 ? v : (v = args[0]),
  next?.(v) ?? v
));

export { Ctx, val };
