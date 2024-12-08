import subprocess from '../../packages/subprocess/index.js';
import path from 'path';
const dir = import.meta.dirname;

export default program => program.command('deploy')
  .description('Deploys services defined in docker-compose.yml.')
  .option('--name [string]', 'Deployment name')
  .option('--dir [string]', 'Project directory')
  .requiredOption('--file <path>', 'Absolute path to docker-compose.yml file')
  .requiredOption('--ssh <string>', 'SSH connection string user@host:port')
  .action((options) => subprocess('bash', path.join(dir, './script.sh'), {
    shell: true,
    stdio: 'inherit',
    env: {
      ...process.env,
      ...(options.name ? { NAME: options.name } : {}),
      DIR: options.dir,
      FILE: options.file,
      SSH: options.ssh
    }
  }));
