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

export default { WS };
