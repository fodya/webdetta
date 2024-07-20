import { RpcServer } from '../rpc/server.js';
export default ({ pool, onOpen, onClose, methods }) => {
  const upgrade = RpcServer();
  if (pool) upgrade.all = pool;
  upgrade.methods = methods;
  upgrade.onOpen = onOpen;
  upgrade.onClose = onClose;
  return { upgrade };
}
