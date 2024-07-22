import { RpcClient } from 'webdetta/rpc/client';
import { SdkInstance } from './server.js';

const WS = (url, clientEntries) => {
  const rpc = RpcClient(url);
  return SdkInstance(rpc, rpc.methods, clientEntries);
}

export default { WS };
