import subprocess from '../../packages/subprocess/index.js';
import path from 'path';
import {fileURLToPath} from 'url';
const dir = path.dirname(fileURLToPath(import.meta.url));

export default program => program.command('deploy')
  .description('Deploys services defined in docker-compose.yml file into a remote machine via SSH.')
  .requiredOption('--file <path>', 'Path to docker-compose.yml file')
  .requiredOption('--name <string>', 'Deployment name')
  .requiredOption('--ssh <string>', 'SSH connection string user@host:port')
  .action((options) => subprocess('bash', path.join(dir, './script.sh'), {
    shell: true,
    stdio: 'inherit',
    env: {
      ...process.env,
      DOCKER_COMPOSE_FILE: options.file,
      COMPOSE_PROJECT_NAME: options.name,
      SSH: options.ssh
    }
  }));
