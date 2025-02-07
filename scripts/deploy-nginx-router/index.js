import subprocess from '../../packages/subprocess/index.js';
const dir = import.meta.dirname;

import script from './script.js';
export default program => program.command('deploy-nginx-router')
  .description('Deploys an nginx router.')
  .option('--name [string]', 'Deployment name')
  .option('--local', 'Whether to use local CA')
  .option('--http-port <number>', 'Nginx HTTP port, default: 80.')
  .option('--https-port <number>', 'Nginx HTTPS port, default: 443.')
  .requiredOption('--certs-path <path>', 'Directory where SSL certificates will be stored')
  .requiredOption('--certbot-email <email>', 'Email to be used with certbot')
  .requiredOption('--ssh <string>', 'SSH connection string user@host:port')
  .requiredOption('--routes <routes>', ['Newline-separated routes.',
    '  Route format:',
    '    hostname:port          directory|proxy_url { nginx_conf_directives }',
    '  Example:',
    '    0.0.0.0:9876           /var/www/something',
    '    0.0.0.0:1234           http://127.0.0.1:8000/some-proxy',
    '    domain.com             /var/www/landing',
    '    app.domain.com         /var/www/app',
    '    api.domain.com         http://127.0.0.1:1000/api {',
    '      proxy_set_header X-Some-Header "Test";',
    '      proxy_cache my_cache;',
    '    }',
  ].join('\n'), (v, acc='') => (acc += '\n' + v))
  .action(script);
