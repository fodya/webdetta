import { Chain, Val } from '../common/chain.js';

class Ctx {
  static current = Val()

  ns = null
  connected = Chain()

  #handler = null
  parent = null
  constructor(handler, parent) {
    if (parent) {
      this.parent = parent;
      parent.connected.on(this.connected);
      parent.reset.on(this.reset);
    }
    if (handler) {
      this.#handler = handler;
      this.update.on(() => this.run(this.#handler, [], null));
    }
    this.reset.on(this.update);
  }
  update = Chain()
  reset = Chain()
  fork(handler) {
    return new Ctx(handler, this);
  }

  #chains_ = new Set()
  get chains() { return this.#chains_; }
  attachChain(chain) {
    const update = this.update.bind(this);
    if (this.#chains_.has(chain)) return;
    const on = () => {
      this.#chains_.add(chain);
      chain.on(update);
    };
    const off = () => {
      this.#chains_.delete(chain);
      chain.off(update);
    };

    let prev;
    this.connected.on((v) =>
      (prev !== v) && ((prev = v) ? (update(), on()) : off())
    );

    on();
  }

  run(func, args=[], thisArg=null) {
    const prevCtx = Ctx.current();
    Ctx.current(this);

    let result, error;
    try { result = func.apply(thisArg, args); }
    catch (e) { error = e; }

    Ctx.current(prevCtx);
    if (error) { throw error; }
    else return result;
  }
}
Ctx.current(new Ctx());

export default Ctx;
