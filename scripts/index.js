#!/usr/bin/env node
import chalk from 'chalk';
import {Command, Option} from 'commander';

const scripts = [
  import('./help.js'),
  import('./deploy/index.js'),
  import('./deploy-nginx-router/index.js')
];

const program = new Command();
for (const m of await Promise.all(scripts)) m.default(program);

const cmd = process.argv[2];
console.log(chalk.green('[webdetta]'), cmd);
if (!cmd) {
  console.log(program.help());
} else if (!program.commands.find(c => c._name.split(' ')[0] == cmd)) {
  console.log('unknown command, try "npx webdetta --help"');
} else {
  program.parse(process.argv);
}
