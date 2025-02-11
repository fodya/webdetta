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

function splitByFirst(str, delimeter) {
  const index = str.indexOf(delimeter);
  return [str.slice(0, index), str.slice(index + 1)];
}
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
  ports="80 80\n443 443",
  local=false,
  ssh,
}) => {
  const output = await tmpDir();
  const IN = p => path.join(import.meta.dirname, p);
  const OUT = p => path.join(output, p);

  const $SERVERS = {};
  const $VOLUMES = [];
  routes = splitString(routes.replaceAll(';', '\n'), '\n', '{}').map(line => {
    if (!(line = line.trim())) return;
    
    const args = splitString(line, ' ', '{}');
    if (args.length < 2 || args.length > 4) throw new Error(
      `Invalid route: ${line}.\n`
    );

    let lineArr = splitString(line, ' ', '{}');

    let modifiers='', route, target, settings;
    if ([...lineArr[0]].every(c => '~^=*'.includes(c))) {
      [modifiers, route, target, settings=''] = lineArr;
    } else {
      [route, target, settings=''] = lineArr;
    }
    let type; [type, target] = splitByFirst(target, ":");

    if (settings.length && (settings[0] != '{' || settings.at(-1) != '}')) {
      console.log({ route, target, settings });
      throw new Error(
        `Invalid route: ${line}.\n` +
        `Nginx.conf directives must be enclosed in curly brackets.`
      );
    }
    settings = settings.replace(/^\{/, '').replace(/\}$/, '')
      .split(';').map(d => d.trim()).filter(d => d).map(d => d + ';');

    return { type, modifiers, route, target, settings };
  }).filter(d => d);

  ports = ports.replaceAll(';', '\n').split('\n')
    .map(d => d.trim()).filter(d => d)
    .map(d => d.split(/\s+/)).map(d => ({
      host: d[0],
      container: d[1]
    }));

  const network = ports.length == 0
    ? 'network_mode: host\n'
    : 'ports:\n' + ports.map(d => `      - ${d.host}:${d.container}\n`).join('')
  console.log('ports:');
  console.table(ports);
  console.log();

  console.log('routes:');
  console.table(routes);
  console.log();
  for (const { type, modifiers, route, target, settings } of routes) {
    const url = toURL(route);
    const domain = url.host;
    const pathname = trimSlash(url.href.replace(url.origin, ''));
    if (!domain) throw new Error(`Invalid route: ${route}`);
    const targetUrl = toURL(target);

    const locations = $SERVERS[domain] ??= [];
    if (type == 'proxy') {
      locations.push(await fileSubst(IN(`./tmpl/nginx-proxy`), {
        $PATH: pathname,
        $PROXY_URL: trimSlash(targetUrl.toString()),
        $SETTINGS: settings.join('\n')
      }));
    }

    if (type == 'dist') {
      const dist = crypto.createHash('md5').update(target).digest('hex');
      $VOLUMES.push(`- ${target}:/var/www/${dist}/`);
      locations.push(await fileSubst(IN(`./tmpl/nginx-dist`), {
        $PATH: pathname,
        $PARAMS: modifiers,
        $TRY_FILES: modifiers == '='
          ? '/index.html'
          : '$uri $uri/ /index.html',
        $DIST: dist,
        $SETTINGS: settings.join('\n')
      }));
    }

    if (type == 'redirect') {
      const dist = crypto.createHash('md5').update(target).digest('hex');
      locations.push(await fileSubst(IN(`./tmpl/nginx-redirect`), {
        $PATH: pathname,
        $PARAMS: modifiers,
        $TARGET_URL: trimSlash(targetUrl.toString()),
        $SETTINGS: settings.join('\n')
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
    $NETWORK: network,
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
