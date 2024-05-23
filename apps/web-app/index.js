import 'dotenv/config';
import Server from 'webdetta/server';
import { handleUncaught } from 'webdetta/server/utils';

handleUncaught();
const { PORT, HOST, API_URL } = process.env;

Server()
  .static('/', './dist')
  .httpProxy.ws.get.post('/api', {
    target: API_URL
  })
  .launch(PORT, HOST);
