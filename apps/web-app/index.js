import 'dotenv/config';
import Server from 'webdetta/server';
import { handleUncaught } from 'webdetta/server/utils';

handleUncaught();
const { PORT, HOST, API_URL } = process.env;

Server()
  .static('/', './src')
  .httpProxy('/api/*', API_URL)
  .wsProxy('/ws', API_URL)
  .launch(PORT, HOST);
