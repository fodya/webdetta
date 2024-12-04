import subprocess from '../../packages/subprocess/index.js';
import path from 'path';
import {fileURLToPath} from 'url';
const dir = path.dirname(fileURLToPath(import.meta.url));

import script from './script.js';
export default program => program.command('configure-nginx-router')
  .description('Creates an nginx router configuration.')
  .requiredOption('--certbot-email <email>', 'Email to be used with certbot')
  .requiredOption('--out <path>', 'Output directory')
  .option('--route <route>', [
    '',
    '  Format:',
    '    <hostname>[:port]    <directory|proxy_url>',
    '  Examples:',
    '    subdomain.domain.com /var/www/website',
    '    0.0.0.0:1234         http://127.0.0.1:8000/some-proxy'
  ].join('\n'), (v, acc=[]) => [...acc, v])
  .action(script);
