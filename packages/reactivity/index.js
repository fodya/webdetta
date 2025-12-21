import { Value, DiffValue, DeferredValue, ProxyValue, Memo } from './signals-extra.js';
import { effect, detach, onAbort } from './effects.js';

export const r = {
  val: Value,
  dval: DiffValue,
  detach: detach,
  effect: effect,
  await: DeferredValue,
  proxy: ProxyValue,
  memo: Memo,
  onAbort: onAbort,
}
