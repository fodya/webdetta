import { RpcServer } from '../rpc/server.js';
import { processCall } from '../rpc/proto.js';
import bytes from 'bytes';
import express from 'express';
import expressWs from 'express-ws';
import cors from 'cors';
import bodyParser from 'body-parser';

const validatePath = path => {
  if (typeof path != 'string') throw Error('Path must be a string');
}

const Server = () => {
  const app = express();
  const instance = {
    server: null,
    launch: (...args) => {
      if (instance.server) throw Error('The server is already up');
      instance.server = app.listen(...args, () =>
        console.log('Running', args)
      );
      return instance;
    },
    wsApi: (path, { pool, onOpen, onClose, ctx, methods }) => {
      validatePath(path);
      if (!app.ws) expressWs(app);
      const upgrade = RpcServer();
      if (pool) upgrade.all = pool;
      upgrade.methods = methods;
      upgrade.onOpen = onOpen;
      upgrade.onClose = onClose;
      app.ws(path, (ws, req) => ctx.call(upgrade(ws), req));
      return instance;
    },
    httpApi: (path, { bodyLimit='50mb', ctx, methods }) => {
      validatePath(path);
      path = path.replace(/\/$/, '') + '/:name';
      const handlers = [];
      if (bodyLimit) handlers.push(
        bodyParser.json({limit: bodyLimit}),
        bodyParser.urlencoded({limit: bodyLimit, extended: true})
      );
      handlers.push(async (req, res) => {
        try {
          let ctx_ = {};
          await ctx.call(ctx_, req, res);
          if (res.headersSent) return;
          const name = req.params.name;
          const args = req.body;
          console.log(path, methods, ctx_, name, args);
          const [result, err] = await processCall(methods, ctx_, name, args);
          if (err) throw err;
          res.status(200).send(JSON.stringify(result));
        } catch (e) {
          console.error(e);
          res.status(500).send(JSON.stringify(e));
        }
      });
      app.post(path, ...handlers);
      return instance;
    },
    httpHandler: (method, path, ...args) => {
      validatePath(path);
      app[method.toLowerCase()](path, ...args);
      return instance;
    },
    static: (path, ...dirs) => {
      validatePath(path);
      for (const dir of dirs)
        app.use(path, express.static(dir));
      return instance;
    },
    cors: (path, options) => {
      validatePath(path);
      app.options(path, cors(options));
      return instance;
    },
    shutdown: async () => {
      await new Promise(r => server.close(r));
    },
  }
  return instance;
}

export default Server;
