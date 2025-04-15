import { WebSocketServer } from 'ws';
import { pathToRegexp } from 'path-to-regexp';

function heartbeat() {
  this.isAlive = true;
}

const WS = ({ server, pulse=60_000 }) => {
  const wss = new WebSocketServer({ noServer: true });
  const routes = [];
  const route_ = raw => (path, handler) => routes.push({
    raw,
    regex: pathToRegexp(path),
    handler: async (...a) => {
      try { await handler(...a); }
      catch (e) { console.error(e); }
    }
  });
  const route = route_(false);
  const routeRaw = route_(true);

  wss.on('connection', (ws, _req) => {
    ws.isAlive = true;
    ws.on('error', console.error);
    ws.on('pong', heartbeat);
  });

  const interval = setInterval(() => {
    wss.clients.forEach(ws => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, pulse);

  wss.on('error', e => console.error(e));
  wss.on('close', () => clearInterval(interval));

  server.on('upgrade', (req, socket, head) => {
    const route = routes.find(r => !!r.regex.exec(req.url));
    if (!route) return socket.destroy();

    if (route.raw) {
      socket.on('error', e => console.error(e));
      route.handler(req, socket, head);
    } else {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
        route.handler(req, ws);
      });
    }
  });

  return Object.assign(wss, { route, routeRaw });
}

export default WS;
