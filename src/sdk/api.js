import { processCall } from '../rpc/proto.js';
import { RpcServer } from '../rpc/server.js';

const onrequest = async (methods, ctx, req, res) => {
  if (!methods.$onrequest) return;
  await methods.$onrequest.call(ctx, req, res);
}

const onsocket = async (methods, ctx, req, ws) => {
  if (!methods.$onsocket) return;
  await methods.$onsocket.call(ctx, req, ws);
}

const HTTP = (methods) => {
  const processRequest = (req, res) => {
    try {
      const name = req.params.name;
      const args = req.body;
      
      const ctx = {};
      await onrequest(methods, ctx, req, res);
      
      const [result, err] = await processCall(methods, ctx, name, args);

      if (err) throw err;
      res.status(200).send(JSON.stringify(result));
    } catch (e) {
      console.error(e);
      res.status(500).send(JSON.stringify(e));
    }
  }
  return { processRequest }
}

const WS (methods) => {
  const upgrade_ = RpcServer();
  upgrade_.methods = methods;
  const upgrade = (req, ws) => {
    const ctx = upgrade_(ws);
    await onsocket(methods, ctx, req, ws);
    return ctx;
  }
  return { upgrade };
}

export const Api = { HTTP, WS };
