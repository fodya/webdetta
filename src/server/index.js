import { RpcServer } from '../rpc/server.js';
import { processCall } from '../rpc/proto.js';
import bytes from 'bytes';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import http from 'http';
import httpProxy from 'http-proxy';
import WSS from './wss.js';

const validatePath = path => {
  if (typeof path != 'string') throw Error('Path must be a string');
}

const collectMethods = (func, methods) =>
  new Proxy((...a) => func(methods, ...a), {
    get: (_, key) => collectMethods(func, (methods ?? []).concat(key))
  });

const Server = () => {
  const app = express();
  const server = http.createServer(app);
  const proxy = httpProxy.createProxyServer({ ws: true });
  const wss = WSS({ server });
  
  const instance = {
    server,
    launch: (...args) => {
      server.listen(...args);
      return instance;
    },
    wsApi: (path, { pool, onOpen, onClose, ctx, methods }) => {
      validatePath(path);
      const upgrade = RpcServer();
      if (pool) upgrade.all = pool;
      upgrade.methods = methods;
      upgrade.onOpen = onOpen;
      upgrade.onClose = onClose;
      wss.route(path, (req, ws) => ctx.call(upgrade(ws), req));
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
    wsHandler: (path, handler) => {
      validatePath(path);
      wss.route(path, handler);
      return instance;
    },
    httpHandler: collectMethods((methods=['all'], path, ...args) => {
      validatePath(path);
      for (const method of methods) app[method.toLowerCase()](path, ...args);
      return instance;
    }),
    wsProxy: (path, resolve) => {
      validatePath(path);
      wss.routeRaw(path, async (req, socket, head) => {
        console.log("proxying upgrade request", req.url, { head: head.toString() });
        const result = await resolve(req, socket, head);
        const opts = typeof result == 'string' ? { target: result } : result;
        await proxy.ws(req, socket, head, opts);
      });
      return instance;
    },
    httpProxy: collectMethods((methods=['all'], path, resolve) => {
      validatePath(path);
      for (const method of methods)
        app[method.toLowerCase()](path, async (req, res, next) => {
          console.log("proxying GET request", req.url);
          const result = await resolve(req, res);
          const opts = typeof result == 'string' ? { target: result } : result;
          await proxy.web(req, res, opts, next);
        });
      return instance;
    }),
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
