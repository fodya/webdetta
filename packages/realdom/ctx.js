import { Chain, Val } from '../common/chain.js';

class Ctx {
  static current = Val()

  ns = null

  connected = Chain()
  update = null
  parent = null

  constructor(update, parent) {
    this.update = update;
    this.parent = parent;
    if (parent) parent.connected.on(this.connected);
    this.bindFunction = this.bindFunction.bind(this);
  }

  #chains = new Set()
  attachChain(chain) {
    const update = this.update;
    if (!update || this.#chains.has(chain)) return;
    this.#chains.add(chain);

    chain.on(update);
    this.connected.on((v) => {
      if (v) { update(); chain.on(update); }
      else { chain.off(update); this.#chains.delete(chain); }
    });
  }

  bindFunction(func) {
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
