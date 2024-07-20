import { safe } from '../common/func.js';
import rpcApiWs from '../rpc-api/ws.js';
import rpcApiHttp from '../rpc-api/http.js';
import { generateSDK } from '../rpc-api/sdk.js';
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

const resolveProxyOptions = safe(async (rslv, req, ...args) => {
  let result = typeof rslv == 'string' ? rslv : await rslv(req, ...args);
  result = typeof result == 'string' ? { target: result } : result;
  const url = new URL(result.target);
  req.url = url.pathname + url.search;
  result.target = url.origin;
  return result;
});

const Server = () => {
  let isSecure = false;
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
      const api = rpcApiWs({ pool, onOpen, onClose, methods });
      wss.route(path, (req, ws) => ctx.call(api.upgrade(ws), req));
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
      const api = rpcApiHttp(methods);
      handlers.push(async (req, res) => {
        await ctx.call(req.ctx = {}, req, res);
        if (res.headersSent) return;
        const r = await api.processCall(req.ctx, req.params.name, req.body);
        res.status(r.status).send(r.result);
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
        const opts = await resolveProxyOptions(resolve, req, socket, head) ?? {};
        await safe(proxy.ws).call(proxy, req, socket, head, opts);
      });
      return instance;
    },
    
    httpProxy: collectMethods((methods=['all'], path, resolve) => {
      validatePath(path);
      for (const method of methods)
        app[method.toLowerCase()](path, async (req, res, next) => {
          const opts = await resolveProxyOptions(resolve, req, res) ?? {};
          await safe(proxy.web).call(proxy, req, res, opts, next);
        });
      return instance;
    }),
    
    wsSdk: (path, methods) => {
      const { handlers, clientCode } = generateSDK(methods);
      instance.httpHandler.get(path, (req, res) => {
        const url = Object.assign(new URL('http://localhost'), {
          host: req.headers.host,
          protocol: isSecure ? 'wss:' : 'ws:',
          pathname: path
        });
        res.contentType('text/javascript');
        res.send(clientCode(url));
      });
      instance.wsApi(path, { ctx: () => {}, methods: handlers });
      return instance;
    },
    
    static: (path, ...dirs) => {
      validatePath(path);
      for (const dir of dirs) app.use(path, express.static(dir));
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
