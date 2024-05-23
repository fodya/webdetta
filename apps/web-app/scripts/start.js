import 'dotenv/config';
import Server from 'webdetta/server';
Server().static('/', './src').launch(process.env.PORT);
