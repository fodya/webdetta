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
    async ctx(req, ws) {
      const success = await auth.call(this, req.headers['sec-websocket-protocol']);
      if (!success) this.close();
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
  .launch(8080, '127.0.0.1');
