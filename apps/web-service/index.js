import Server from 'webdetta/server';

const connections = new Set();

Server({ port: 8080, host: '127.0.0.1' })
  .static('/', './dist')
  .wsApi('/ws', {
    pool: connections,
    onOpen: conn => {
      console.log('open', conn);
      conn.cast('displayMessage', 'welcome to the server');
    },
    onClose: conn => console.log('close', conn),
    methods: {
      add: (a, b) => a + b,
      sayHi: function () {
        for (const conn of connections) {
          conn.cast('displayMessage', 'hi');
        }
      }
    }
  })
  .httpApi('/api', {
    ctx: (req) => {
      return { user: req.headers.Authorization }
    },
    methods: {
      sayHi(number) {
        return `Hello, ${this.user}. Number: ${number}`;
      }
    }
  })
  .launch();

