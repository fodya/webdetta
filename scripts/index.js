#!/usr/bin/env node
import subprocess from '../packages/subprocess/index.js';
import {Command, Option} from 'commander';
import path from 'path';
import {fileURLToPath} from 'url';

const program = new Command();
const dir = path.dirname(fileURLToPath(import.meta.url));

program
  .name('npx webdetta')
  .usage("<command>")
  .version('1.0.0')
  .configureHelp({
    subcommandTerm: cmd => cmd.name() + cmd.usage().replace('[options]', '')
  })
  .helpCommand(false);

program.command('help')
  .argument('[command]')
  .action(function (...a) {
    if (this.args[0]) {
      const cmd = this.parent.commands.find(c => c._name == this.args[0]);
      if (!cmd) console.error('Unknown command: ', this.args[0]);
      else console.log(cmd.helpInformation());
    }
    else {
      console.log(program.help());
    }
  });

program.command('deploy')
  .description('Deploys services defined in docker-compose.yml file into a remote machine via SSH.')
  .requiredOption('-f, --file <path>', 'Path to docker-compose.yml file')
  .requiredOption('-p, --project <name>', 'Project name to distinguish different deployments')
  .requiredOption('-u, --user <username>', 'Remote ssh user')
  .requiredOption('-h, --host <host>', 'Remote ssh host')
  .action(async (options) => {
    await subprocess('bash', path.join(dir, './deploy.sh'), {
      shell: true,
      stdio: 'inherit',
      env: {
        ...process.env,
        DOCKER_COMPOSE_FILE: options.file,
        COMPOSE_PROJECT_NAME: options.project,
        SSH_USER: options.user,
        SSH_HOST: options.host
      }
    });
  });

const cmd = process.argv[2];
if (!cmd) {
  console.log(program.help());
} else if (!program.commands.find(c => c._name.split(' ')[0] == cmd)) {
  console.log('unknown command, try "npx webdetta --help"');
} else {
  program.parse(process.argv);
}
