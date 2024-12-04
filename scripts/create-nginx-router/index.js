import subprocess from '../../packages/subprocess/index.js';
import path from 'path';
import {fileURLToPath} from 'url';
const dir = path.dirname(fileURLToPath(import.meta.url));

import script from './script.js';
export default program => program.command('create-nginx-router')
  .description('Creates an nginx router configuration.')
  .requiredOption('--certs-path <path>', 'Directory where SSL certificates will be stored')
  .requiredOption('--certbot-email <email>', 'Email to be used with certbot')
  .requiredOption('--output <path>', 'Output directory')
  .option('--routes <routes>', [
    'Newline-separated routes.',
    '  Route format:',
    '    <hostname>[:port]      <directory|proxy_url>',
    '  Example:',
    '    subdomain.domain.com   /var/www/website',
    '    0.0.0.0:1234           http://127.0.0.1:8000/some-proxy'
  ].join('\n'), (v, acc=[]) => [...acc, v])
  .action(script);
