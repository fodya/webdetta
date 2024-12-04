import { writeFile, readFile, copyFile, readdir } from 'fs/promises';
import crypto from 'crypto';
import path from 'path';
import subprocess from '../../packages/subprocess/index.js';
import { S } from '../../packages/common/utils.js';
import { __dirname } from '../../packages/common/node.js';

const exec = (...cmd) => subprocess(...cmd, { stdio: 'inherit' });
const fileSubst = async (file, env) => {
  let str = (await readFile(file)).toString('utf8');
  for (const [k, v] of Object.entries(env)) str = str.replaceAll(k, v);
  return str;
}
const fileMap = async (fileIn, fileOut, env) =>
  await writeFile(fileOut, await fileSubst(fileIn, env));
const toURL = (str) => {
  if (str.startsWith('/')) return null;
  try { return new URL(str); } catch (e) {};
  try { return new URL('https://' + str); } catch (e) {};
}
const trimSlash = (str) => str.replace(/(^\/)|(\/$)/g, '');

export default async ({
  certbotEmail,
  route,
  out
}) => {
  const IN = p => path.join(__dirname(import.meta.url), p);
  const OUT = p => path.join(path.resolve(process.cwd(), out), p);

  const $SERVERS = {};
  const $VOLUMES = [];
  const routes = route.map(d => d.trim().split(/\s+/))
  for (const [route, str] of routes) {
    const url = toURL(route);
    const domain = url.host;
    const pathname = trimSlash(url.href.replace(url.origin, ''));
    if (!domain) throw new Error(`Invalid route: ${route}`);
    const targetUrl = toURL(str);

    const locations = $SERVERS[domain] ??= [];
    if (targetUrl) {
      locations.push(await fileSubst(IN(`./tmpl/nginx-proxy`), {
        $PATH: pathname,
        $PROXY_URL: trimSlash(targetUrl.toString())
      }));
    } else {
      const dist = crypto.randomUUID();
      $VOLUMES.push(`- ${str}:/var/www/${dist}/`);
      locations.push(await fileSubst(IN(`./tmpl/nginx-dist`), {
        $PATH: pathname,
        $DIST: dist
      }));
    }
  }

  await copyFile(IN('./Dockerfile'), OUT('./Dockerfile'));
  await fileMap(IN('./tmpl/nginx.conf'), OUT('./nginx.conf'), {
    $SERVERS: await Promise.all(
      Object.entries($SERVERS).map(([$DOMAIN, $LOCATIONS]) =>
        fileSubst(IN('./tmpl/nginx-server'), {
          $DOMAIN,
          $LOCATIONS: $LOCATIONS.flatMap(d => d.split('\n')).join('\n  ')
        })
      )
    ).then(r => r.join('\n'))
  });
  await fileMap(IN('./tmpl/docker-compose.yml'), OUT('./docker-compose.yml'), {
    $CERTBOT_EMAIL: certbotEmail,
    $VOLUMES: $VOLUMES.flatMap(d => d.split('\n')).join('\n      ')
  });
}
