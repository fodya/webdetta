import { encode, decode } from "msgpackr";
import { RpcClient } from '../rpc/client.js';
import { SdkInstance } from './instance.js';

const WS = (metaurl, clientEntries) => {
  const url = Object.assign(new URL(metaurl), { search: '' });
  const rpc = RpcClient(url);
  for (const { rpcHandler } of clientEntries) {
    if (!rpcHandler?.value) continue;
    const handler = rpcHandler.value;
    rpcHandler.value = (...a) => handler.apply(instance, a);
  }
  const instance = SdkInstance(rpc, rpc.methods, clientEntries);
  return instance;
}

export const sdkUtils = {
  logger: (instance, log) => {
    instance['#internals'].rpc.onMessage((d) => {
      if (!d.data) return;
      const data = decode(d.data);
      log('[rpc]', ...(
        'to' in data
        ? [`#${data.to}`, '<=', data.res]
        : [data.call, '<=', data.args, `@${data.from}`]
      ))
    });
    instance['#internals'].rpc.onSend((d) => {
      const data = decode(d);
      log('[rpc]', ...(
        'to' in data
        ? [data.res, '=>', `#${data.to}`]
        : [`@${data.from}`, data.call, '=>', data.args]
      ))
    });
  },
  onUpdate: (instance, cb) => {
    instance['#internals'].rpc.onSend(cb);
    instance['#internals'].rpc.onMessage(cb);
  }
}

export default { WS };
