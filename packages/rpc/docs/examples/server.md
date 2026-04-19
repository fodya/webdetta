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
