import bytes from 'bytes';
import express from 'express';
import expressWs from 'express-ws';
import cors from 'cors';
import bodyParser from 'body-parser';

const validatePath = path => {
  if (typeof path != 'string') throw Error('path must be a string');
}

const Server = ({
  port, host, requestSizeLimit
}) => {
  const app = express();
  app.use(bodyParser.json({limit: requestSizeLimit}));
  app.use(bodyParser.urlencoded({limit: requestSizeLimit, extended: true}));
  
  const instance = {
    server: null,
    launch: () => {
      if (instance.server) throw Error('The server is already up');
      instance.server = app.listen(...[port, host].filter(v => v), () =>
        console.log('Running', { port, host })
      );
      return instance;
    },
    shutdown: async () => {
      await new Promise(r => server.close(r));
    },
    wsApi: (path, methods) => {
      validatePath(path);
      if (!app.ws) expressWs(app);
      app.ws('/', (ws, req) => {
        ws.on('message', msg => {
          console.log(msg)
        })
      });
      return instance;
    },
    httpApi: (path, methods) => {
      validatePath(path);
      return instance;
    },
    static: (path, ...dirs) => {
      validatePath(path);
      for (const dir of dirs)
        app.use(path, express.static(dir));
      return instance;
    },
    cors: (path, options) => {
      validatePath(path);
      app.options(path, cors(options));
      return instance;
    }
  }
  return instance;
}

export default Server;
