# Router

Client-side history/hash routing library.

## Usage

```javascript
import { PathnameRouter, HashRouter } from 'webdetta/router';

// Pathname-based routing
const router = PathnameRouter({
  '/': () => console.log('Home'),
  '/about': () => console.log('About'),
  '/user/:id': (params) => console.log('User:', params.id)
}, { prefix: '/app' });

// Hash-based routing
const hashRouter = HashRouter({
  '#/': () => console.log('Home'),
  '#/about': () => console.log('About')
});
```

## API

- `PathnameRouter(routes, options)` - Creates a pathname-based router
  - `routes` - Object mapping paths to handlers
  - `options.prefix` - URL prefix (default: `''`)
- `HashRouter(routes)` - Creates a hash-based router
  - `routes` - Object mapping hash paths to handlers

