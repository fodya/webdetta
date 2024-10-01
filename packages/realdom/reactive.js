import { Chain, Val } from '../common/chain.js';
import { throttle } from '../common/func.js';
import Ctx from './ctx.js';

const reactive = (chain) =>
  chain.listen(() => Ctx.current()?.attachChain?.(chain));

export const val = v => {
  const chain = reactive(Val(v));
  Ctx.current().reset.listen(() => chain(v));
  return chain;
}
export const ref = (o, k) => reactive(Ref(o, k));

export const derived = (func) => {
  const value = reactive(Val());
  const ctx = Ctx.current().fork(throttle(() => value(func())));
  ctx.update();
  return value;
}

const await_ = (chain) => {
  const value = reactive(Val());
  const update = v => Promise.resolve(v).then(value);
  chain.on(update);
  update(chain());
  return value;
}
export { await_ as "await" };

export const diff = (chain) => {
  const value = reactive(Val(chain()));
  chain.on(v => (value() !== v) && value(v));
  return value();
}
