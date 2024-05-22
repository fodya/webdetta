import Server from 'webdetta/server';

const wsConnections = new Set();

const getUser = d => d;
const methods = {
  async login(token) {
    this.user = await getUser(token);
  },
  sayHi(number) {
    return `Hello, ${this.user}. Number: ${number}`;
  }
}

Server()
  .static('/', './dist')
  .wsApi('/ws', {
    pool: wsConnections,
    onOpen: conn => console.log('open', conn),
    onClose: conn => console.log('close', conn),
    methods: methods
  })
  .httpApi('/api', {
    async ctx(req) {
      await methods.login.call(this, req.headers['authorization']);
    },
    methods: methods
  })
  .launch(8080, '127.0.0.1');
