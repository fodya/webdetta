# RPC

Remote Procedure Call library for realtime APIs using WebSockets.

## Usage

### Client

```javascript
import { RpcClient } from 'webdetta/rpc/client';

const client = RpcClient('ws://localhost:3000');

// Call (send and wait for response)
await client.call('methodName', arg1, arg2);

// Cast (send and forget)
client.cast('eventName', data);
```

### Server

```javascript
import { RpcServer } from 'webdetta/rpc/server';

const server = RpcServer({ PULSE: 60000 });

// Register methods
server.on('methodName', async (arg1, arg2) => {
  return 'result';
});

// Handle casts
server.on('eventName', (data) => {
  console.log('Received:', data);
});
```

## Features

- WebSocket-based communication
- Keep-alive mechanism
- Automatic reconnection
- Binary protocol support (MessagePack)
- Request/response and cast (fire-and-forget) patterns

