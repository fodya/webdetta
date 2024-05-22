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

const Server = ({ port, host }) => {
  const app = express();
  const instance = {
    server: null,
    launch: () => {
      if (instance.server) throw Error('The server is already up');
      instance.server = app.listen(...[port, host].filter(v => v), () =>
        console.log('Running', { port, host })
      );
      return instance;
    },
    wsApi: (path, { pool, onOpen, onClose, methods }) => {
      validatePath(path);
      if (!app.ws) expressWs(app);
      const upgrade = RpcServer();
      if (pool) upgrade.all = pool;
      upgrade.methods = methods;
      upgrade.onOpen = onOpen;
      upgrade.onClose = onClose;
      app.ws(path, (ws, req) => upgrade(ws));
      return instance;
    },
    httpApi: (path, { bodyLimit='50mb', getCtx, methods }) => {
      validatePath(path);
      const handlers = [];
      if (bodyLimit) {
        handlers.push(bodyParser.json({limit: bodyLimit}));
        handlers.push(bodyParser.urlencoded({limit: bodyLimit, extended: true}));
      }
      
      path = path.replace(/\/$/, '') + '/:name';
      handlers.push(async (req, res) => {
        try {
          const ctx_ = await ctx(req, res);
          const name = req.params.name;
          const args = req.body;
          const [res, err] = await processCall(methods, ctx_, name, args);
          if (err) throw err;
          res.send(200, JSON.stringify(res));
        } catch (e) {
          res.send(500, JSON.stringify(e));
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
