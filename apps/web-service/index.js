import 'dotenv/config';
import Server from 'webdetta/server';
import { handleUncaught } from 'webdetta/server/utils';
import { wsConnections, auth, methods } from './src/api.js';

handleUncaught();
const { PORT, HOST } = process.env;

Server()
  .static('/', './public')
  .wsApi('/ws', {
    pool: wsConnections,
    onOpen: conn => {},
    onClose: conn => {},
    async ctx(req) {
      console.log('ws', req.headers.origin);
      const success = await auth.call(this, req.headers['sec-websocket-protocol']);
      if (!success) this.close(4401);
    },
    methods: methods
  })
  .httpApi('/api', {
    async ctx(req, res) {
      const success = await auth.call(this, req.headers['authorization']);
      if (!success) res.status(401);
    },
    methods: methods
  })
  .launch(PORT, HOST, () => console.log('Running', PORT, HOST));
