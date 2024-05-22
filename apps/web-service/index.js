import Server from 'webdetta/server';

const connections = new Set();

Server({ port: 8000, host: '127.0.0.1' })
  .static('/', './dist')
  .wsApi('/ws', {
    pool: connections,
    onOpen: conn => console.log('open', conn),
    onClose: conn => console.log('close', conn),
    methods: {
      add: (a, b) => a + b,
      sayHi: function () {
        for (const conn of connections) {
          conn.cast('hi');
        }
      }
    }
  })
  .launch();

