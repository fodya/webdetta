import { Chain, Val } from '../common/chain.js';
import Ctx from './ctx.js';

const signal = (chain) => {
  chain.on(() => { Ctx.current()?.attachChain?.(chain); });
  return chain;
}

const val = v => signal(Val(v));

export { Ctx, val };
