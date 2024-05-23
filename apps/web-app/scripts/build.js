import path from 'path';
import fs from 'fs';
import util from 'util';
import { subprocess } from 'webdetta/server/utils';
import htmlParser from 'node-html-parser';

const html = htmlParser.parse(fs.readFileSync('./src/index.html'));
const { imports } = JSON.parse(
  html.querySelector('script[type="importmap"]').innerText
);

const packageSources = {
  'https://cdn.jsdelivr.net': url =>
    new URL(url).pathname.replace('/npm/', '').split('/')[0]
}

for (let [key, val] of Object.entries(imports)) {
  delete imports[key];
  const source = Object.keys(packageSources).find(d => val.startsWith(d));
  if (source) {
    val = packageSources[source](val)  
  } else {
    key = key.replace(/\/$/g, '/*');
    val = val.replace(/\/$/g, '/*');
    val = path.join('./src', val);
  }
  imports[key] = val;
}

const pkg = JSON.parse(fs.readFileSync('package.json'));
pkg.imports = imports;
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));

await subprocess('npm', ['install'], {
  onData: d => console.log(d.toString()),
  onError: d => console.error(d.toString())
}).completion;

await subprocess('rollup', ['-c'], {
  onData: d => console.log(d.toString()),
  onError: d => console.error(d.toString())
}).completion;
