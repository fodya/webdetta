import { Chain, Effect } from '../common/chain.js';
import Ctx from './ctx.js';

const signal = (accessor) => {
  const chain = Chain(
    Effect(() => { Ctx.current()?.attachChain?.(chain); }),
    accessor
  );
  return chain;
}

const val = v => signal((next, ...args) => (
  args.length == 0 ? v : (v = args[0]),
  next?.(v) ?? v
));

export { Ctx, val };
