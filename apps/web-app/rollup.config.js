import terser from '@rollup/plugin-terser';
import NodeResolve from '@rollup/plugin-node-resolve';
import ImportCSS from 'rollup-plugin-import-css';
import Delete from 'rollup-plugin-delete'
import Copy from 'rollup-plugin-copy'

import fs from 'fs';
const VERSION = fs.readFileSync('./version', 'utf8');

import 'dotenv/config';
import path from 'path';

const DIST = './dist/';

const plugins = [
  NodeResolve(),
  ImportCSS(),
  Delete({
    force: true,
    targets: DIST
  }),
  Copy({
    targets: [
      { src: './src/assets/*', dest: path.resolve(DIST, './assets') },
      { src: './src/index.html', dest: path.resolve(DIST) },
    ]
  }),
  terser(),
];

export default {
  input: `./src/index.js`,
  output: {
    dir: DIST,
    format: 'es',
    // sourcemap: true
  },
  preserveSymlinks: true,
  plugins: plugins,
  preserveEntrySignatures: 'strict',
};
