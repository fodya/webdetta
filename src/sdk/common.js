import { processCall } from '../rpc/proto.js';
import { RpcServer } from '../rpc/server.js';
import FunctionParser from 'parse-function';

const parser = FunctionParser();
export const parseFn = val => {
  const { args, defaults, body, isArrow } = parser.parse(val);
  if (isArrow) throw new Error('Arrow functions are not allowed.');
  const args_ = args
    .map(d => defaults[d] ? d + '=' + defaults[d] : d)
    .join(', ');
  return { args: args_, body };
}

const onrequest = async (methods, ctx, req, res) => {
  if (!methods.$onrequest) return;
  await methods.$onrequest.call(ctx, req, res);
}

const onsocket = async (methods, ctx, req, ws) => {
  if (!methods.$onsocket) return;
  await methods.$onsocket.call(ctx, req, ws);
}

export const Api = {
  HTTP: (methods) => {
    const processRequest = async (req, res) => {
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
  },
  WS: (methods) => {
    const upgrade_ = RpcServer();
    upgrade_.methods = methods;
    const upgrade = async (req, ws) => {
      const ctx = upgrade_(ws);
      await onsocket(methods, ctx, req, ws);
      return ctx;
    }
    return { upgrade };
  }
};
