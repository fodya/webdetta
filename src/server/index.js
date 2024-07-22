import { safe } from '../common/func.js';
import { Api } from '../sdk/api.js';
import { SdkServer } from '../sdk/sdk.js';
import bytes from 'bytes';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import http from 'http';
import httpProxy from 'http-proxy';
import WSS from './wss.js';

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
    
    wsApi: (path, methods) => {
      const api = Api.WS(methods);
      wss.route(path, (req, ws) => api.upgrade(req, ws));
      return instance;
    },
    
    httpApi: (path, methods) => {
      path = path.replace(/\/$/, '') + '/:name';
      const api = Api.HTTP(methods);
      app.post(path, bodyParser.json({limit: '50mb'}), api.processRequest);
      return instance;
    },
    
    wsHandler: (path, handler) => {
      wss.route(path, handler);
      return instance;
    },
    
    httpHandler: collectMethods((methods=['all'], path, ...args) => {
      for (const method of methods) app[method.toLowerCase()](path, ...args);
      return instance;
    }),
    
    wsProxy: (path, resolve) => {
      wss.routeRaw(path, async (req, socket, head) => {
        const opts = await resolveProxyOptions(resolve, req, socket, head) ?? {};
        await safe(proxy.ws).call(proxy, req, socket, head, opts);
      });
      return instance;
    },
    
    httpProxy: collectMethods((methods=['all'], path, resolve) => {
      for (const method of methods)
        app[method.toLowerCase()](path, async (req, res, next) => {
          const opts = await resolveProxyOptions(resolve, req, res) ?? {};
          await safe(proxy.web).call(proxy, req, res, opts, next);
        });
      return instance;
    }),
    
    sdk: (path, methods) => {
      const { serverMethods, clientCode } = SdkServer(methods);
      instance.httpHandler.get(path, SdkServer.httpHandler(clientCode));
      instance.wsApi(path, { methods: serverMethods });
      return instance;
    },
    
    static: (path, ...dirs) => {
      for (const dir of dirs) app.use(path, express.static(dir));
      return instance;
    },
    
    cors: (path, options) => {
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
