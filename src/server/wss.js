import { WebSocketServer } from 'ws';
import { pathToRegexp } from 'path-to-regexp';

function heartbeat() {
  this.isAlive = true;
}

const WS = ({ server, pulse=60_000 }) => {
  const wss = new WebSocketServer({ server });
  const routes = [];
  const route = (path, handler) =>
    routes.push({ regex: pathToRegexp(path), handler });

  wss.on('connection', (ws, req) => {
    const route = routes.find(r => !!r.regex.exec(req.url));
    if (!route) return ws.close();
    route.handler(req, ws);
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
  
  return Object.assign(wss, { route });
}

export default WS;
