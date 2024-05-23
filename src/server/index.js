import { RpcServer } from '../rpc/server.js';
import { processCall } from '../rpc/proto.js';
import bytes from 'bytes';
import express from 'express';
import expressWs from 'express-ws';
import cors from 'cors';
import bodyParser from 'body-parser';
import http from 'http';
import httpProxy from 'http-proxy';
import { pathToRegexp } from 'path-to-regexp';

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
  
  const instance = {
    server: null,
    launch: (...args) => {
      if (instance.server) throw Error('The server is already up');
      server.listen(...args, () => console.log('Running', args));
      instance.server = server;
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
    httpHandler: collectMethods((methods=['all'], path, ...args) => {
      validatePath(path);
      methods = methods.map(d => d.toLowerCase());
      for (const method of methods) app[method](path, ...args);
      return instance;
    }),
    httpProxy: collectMethods((methods=['all'], path, target, middleware) => {
      validatePath(path);
      methods = methods.map(d => d.toLowerCase());
      const proxy = httpProxy.createProxyServer({ target, ws: true });
      
      for (const method of methods) {
        if (method == 'ws') continue;
        app[method](path, (req, res) => {
          console.log("proxying GET request", req.url);
          proxy.web(req, res, {});
        });
      }
      
      if (['all', 'ws'].some(m => methods.includes(m))) {
        const regex = pathToRegexp(path);
        server.on('upgrade', (req, socket, head) => {
          if (!regex.exec(req.url)) return;
          proxy.ws(req, socket, head);
          console.log("proxying upgrade request", req.url, head.toString());
        });
      }
      
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
