import { Chain, Val } from '../common/chain.js';
import Ctx from './ctx.js';

const signal = (chain) =>
  chain.listen(() => Ctx.current()?.attachChain?.(chain));

const val = v => signal(Val(v));

export { Ctx, val };
