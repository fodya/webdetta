import fs from 'fs/promises';
import crypto from 'crypto';
import path from 'path';
import subprocess from '../../packages/subprocess/index.js';
import { S } from '../../packages/common/utils.js';
import { tmpDir } from "../../packages/common/fs.js";

const fileSubst = async (file, env) => {
  let str = (await fs.readFile(file)).toString('utf8');
  for (const [k, v] of Object.entries(env)) str = str.replaceAll(k, v);
  return str;
}
const fileMap = async (fileIn, fileOut, env) =>
  await fs.writeFile(fileOut, await fileSubst(fileIn, env));
const toURL = (str) => {
  if (str.startsWith('/')) return null;
  try { return new URL(str); } catch (e) {};
  try { return new URL('https://' + str); } catch (e) {};
}
const trimSlash = (str) => str.replace(/(^\/)|(\/$)/g, '');

function splitString(str, delimeter, brackets) {
  const res = [];
  const [open, close] = brackets;
  let acc = '', depth = 0;

  const push = () => acc && (res.push(acc), acc = '');
  for (const c of str) {
    depth += c == open ? 1 : c == close ? -1 : 0;
    if (c == delimeter && depth == 0) push();
    else acc += c;
  }
  push();
  return res;
}

export default async ({
  certsPath='',
  certbotEmail='',
  routes='',
  port=80,
  local=false,
  ssh,
}) => {
  const output = await tmpDir();
  const IN = p => path.join(import.meta.dirname, p);
  const OUT = p => path.join(output, p);

  const $SERVERS = {};
  const $VOLUMES = [];
  routes = splitString(routes, '\n', '{}').map(line => {
    if (!(line = line.trim())) return;
    const args = splitString(line, ' ', '{}');
    if (args.length < 2 || args.length > 3) throw new Error(
      `Invalid route: ${line}.\n`
    );

    let [route, target, settings=''] = splitString(line, ' ', '{}');
    if (settings.length && (settings[0] != '{' || settings.at(-1) != '}')) {
      console.log({ route, target, settings });
      throw new Error(
        `Invalid route: ${line}.\n` +
        `Nginx.conf directives must be enclosed in curly brackets.`
      );
    }

    settings = settings.replace(/^\{/, '').replace(/\}$/, '');
    return { route, target, settings };
  }).filter(d => d);

  console.table(routes);
  for (const { route, target, settings } of routes) {
    const url = toURL(route);
    const domain = url.host;
    const pathname = trimSlash(url.href.replace(url.origin, ''));
    if (!domain) throw new Error(`Invalid route: ${route}`);
    const targetUrl = toURL(target);

    const locations = $SERVERS[domain] ??= [];
    if (targetUrl) {
      locations.push(await fileSubst(IN(`./tmpl/nginx-proxy`), {
        $PATH: pathname,
        $PROXY_URL: trimSlash(targetUrl.toString()),
        $SETTINGS: settings
      }));
    } else {
      const dist = crypto.createHash('md5').update(target).digest('hex');
      $VOLUMES.push(`- ${target}:/var/www/${dist}/`);
      locations.push(await fileSubst(IN(`./tmpl/nginx-dist`), {
        $PATH: pathname,
        $DIST: dist,
        $SETTINGS: settings
      }));
    }
  }

  await fs.copyFile(IN('./Dockerfile'), OUT('./Dockerfile'));
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
    $PORT: port,
    $LOCAL_CA: local ? 1 : 0,
    $NGINX_SECRETS: certsPath,
    $CERTBOT_EMAIL: certbotEmail,
    $VOLUMES: $VOLUMES.flatMap(d => d.split('\n')).join('\n      ')
  });
  await fileMap(IN('./Dockerfile'), OUT('./Dockerfile'), {});

  console.log('Generated files:');
  console.log('-', OUT('docker-compose.yml'));
  console.log('-', OUT('Dockerfile'));
  console.log('-', OUT('nginx.conf'));
  try {
    await subprocess(...S`npx webdetta deploy
      --file ${OUT('docker-compose.yml')}
      --ssh ${ssh}
    `);
  }
  catch (e) { console.error(e); }
  finally { await fs.rm(OUT('./'), { recursive: true, force: true }); }
}
