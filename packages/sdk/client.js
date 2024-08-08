import { RpcClient } from '../rpc/client.js';
import { SdkInstance } from './instance.js';

const WS = (metaurl, clientEntries) => {
  const url = Object.assign(new URL(metaurl), { search: '' });
  const rpc = RpcClient(url);
  return SdkInstance(rpc, rpc.methods, clientEntries);
}

export default { WS };
