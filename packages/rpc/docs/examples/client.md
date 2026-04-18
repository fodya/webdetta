### Client

```javascript
import { RpcClient } from 'webdetta/rpc/client';

const client = RpcClient('ws://localhost:3000');

// Call (send and wait for response)
await client.call('methodName', arg1, arg2);

// Cast (send and forget)
client.cast('eventName', data);
```
