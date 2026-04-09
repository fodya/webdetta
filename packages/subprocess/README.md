# Subprocess

child_process syntax sugar — spawns OS processes as promises.

## Usage

### Basic Example

```javascript
import subprocess from 'webdetta/subprocess';

// Simple command execution
await subprocess('echo', 'Hello, World!');
```

### Advanced Example

```javascript
import subprocess from 'webdetta/subprocess';

// Spawn a process
const proc = subprocess('node', 'script.js', { stdio: 'inherit' });

// Wait for completion
await proc; // Resolves when process exits with code 0

// Access process properties
console.log(proc.pid);
proc.kill();
```

## API

- `subprocess(command, ...args, options)` - Spawns a process
  - Returns a Promise that resolves when the process exits with code 0
  - Rejects if the process exits with a non-zero code
  - Provides access to the underlying process object (pid, kill, etc.)
  - `options` — [child_process.spawn](https://nodejs.org/api/child_process.html#child_processspawncommand-args-options) options object (`stdio`, `cwd`, `env`, etc.)

