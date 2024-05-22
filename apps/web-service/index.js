import Server from 'webdetta/server';

const wsConnections = new Set();

const getUser = async d => d;
const auth = async function (token) {
  this.user = await getUser(token);
  return !!this.user;
}
const methods = {
  sayHiTo(someone) {
    return `Hello, ${someone}. From: ${this.user}`;
  },
  sayHiToAll() {
    for (const conn of wsConnections) if (conn != this)
      conn.cast('message', methods.sayHiTo.call(this, conn.user));
  }
}

Server()
  .static('/', './dist')
  .wsApi('/ws', {
    pool: wsConnections,
    onOpen: conn => console.log('open', conn),
    onClose: conn => console.log('close', conn),
    async ctx(req, ws, next) {
      const success = await auth.call(this, req.headers['sec-websocket-protocol']);
      console.log({success}, this);
      if (success) next(); else ws.close();
    },
    methods: methods
  })
  .httpApi('/api', {
    async ctx(req, res, next) {
      const success = await auth.call(this, req.headers['authorization']);
      if (success) next(); else res.status(401);
    },
    methods: methods
  })
  .launch(8080, '127.0.0.1');
