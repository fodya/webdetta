import { encode, decode } from "../rpc/proto.js";
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

const callToString = data =>
  `${data.call}(${data.args.map(d => JSON.stringify(d)).join(', ')})`;
export const sdkUtils = {
  logger: (instance, log) => {
    instance['#internals'].rpc.onMessage((d) => {
      if (!d.data?.length && !d.data.byteLength) return;
      const data = decode(d.data);
      log('[rpc]', ...(
        'to' in data
        ? [`#${data.to}`, '<=', data.res]
        : [callToString(data), `@${data.from}`]
      ))
    });
    instance['#internals'].rpc.onSend((d) => {
      const data = decode(d);
      log('[rpc]', ...(
        'to' in data
        ? [data.res, '=>', `#${data.to}`]
        : [`@${data.from}`, callToString(data)]
      ))
    });
  },
  onUpdate: (instance, cb) => {
    instance['#internals'].rpc.onSend(cb);
    instance['#internals'].rpc.onMessage(cb);
  }
}

export default { WS };
