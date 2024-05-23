import { WebSocketServer } from 'ws';
import { pathToRegexp } from 'path-to-regexp';

function heartbeat() {
  this.isAlive = true;
}

const WS = ({ server, pulse=60_000 }) => {
  const wss = new WebSocketServer({ noServer: true });
  const routes = [];
  const route = (path, handler) =>
    routes.push({ regex: pathToRegexp(path), handler });
  const routeRaw = (path, handler) =>
    routes.push({ regex: pathToRegexp(path), handler, raw: true });

  wss.on('connection', (ws, req) => {
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

  wss.on('close', () => clearInterval(interval));
  
  server.on('upgrade', (req, socket, head) => {
    const route = routes.find(r => !!r.regex.exec(req.url));
    if (!route) return socket.destroy();
    
    if (route.raw) route.handler(req, socket);
    else {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
        route.handler(req, ws);
      });
    }
  });
  
  return Object.assign(wss, { route, routeRaw });
}

export default WS;
