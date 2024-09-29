import { Chain, Effect } from '../common/chain.js';

class Ctx {
  static current = Chain()

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
      const prevCtx = Ctx.current();
      Ctx.current(this);

      let result, error;
      try { result = func(...a); }
      catch (e) { error = e; }

      Ctx.current(prevCtx);
      if (error) { throw error; }
      else return result;
    }
  }
}

export default Ctx;
