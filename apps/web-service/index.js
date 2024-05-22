import Server from 'webdetta/server';

Server({ port: 8000, host: '127.0.0.1' })
  .static('/', './dist')
  .wsApi('/ws', {
    onOpen: conn => {
      console.log('open', conn);
    },
    onClose: conn => {
      console.log('close', conn);
    },
    methods: {
      add: (a, b) => a + b,
      sayHi: function () {
        
      }
    }
  })

console.log(Server);
