# Radix Tree Router

A high-performance HTTP router using radix tree algorithm for Node.js and Bun.

## Features

- ⚡ **Fast** - 25M+ ops/sec, faster than find-my-way
- 🪶 **Lightweight** - Only 15KB, zero dependencies
- 🎯 **Flexible** - Static, dynamic, wildcard, and regex routes
- 🔧 **TypeScript** - Full type safety
- 🌲 **Radix Tree** - Efficient path matching algorithm

## Quick Start

```typescript
import {RadixTree} from '@your-scope/radix-tree-router';

const router = new RadixTree();

// Add routes
router.add('GET', '/users', () => 'List users');
router.add('GET', '/users/:id', () => 'Get user');
router.add('GET', '/files/*', () => 'Serve files');

// Match routes
const [handlers, params] = router.match('GET', '/users/123');
const handler = handlers[0][0]; // Get handler
const paramMap = handlers[0][1]; // Get param mapping: {id: 0}
console.log(params); // ['123']
```

## Route Types

### Static Routes

```typescript
router.add('GET', '/about', handler);
router.add('POST', '/login', handler);
```

### Dynamic Routes (Parameters)

```typescript
router.add('GET', '/users/:id', handler);
router.add('GET', '/posts/:category/:slug', handler);

const [handlers, params] = router.match('GET', '/users/42');
// params = ['42']
```

### Wildcard Routes

```typescript
router.add('GET', '/static/*', handler);

const [handlers, params] = router.match('GET', '/static/css/style.css');
// params = ['css/style.css']
```

### Regex Routes

```typescript
// Match only numeric IDs
router.add('GET', '/users/:id(\\d+)', handler);

// Match with static suffix
router.add('GET', '/files/:name.jpg', handler);
```

### Optional Parameters

```typescript
router.add('GET', '/posts/:id?', handler);
// Matches both /posts and /posts/123
```

## API

### `new RadixTree<T>()`

Create a new router instance.

```typescript
const router = new RadixTree<Handler>();
```

### `add(method: string, path: string, handler: T): void`

Add a route to the router.

**Parameters:**
- `method` - HTTP method (GET, POST, etc.)
- `path` - Route path
- `handler` - Handler function or any value

```typescript
router.add('GET', '/api/users/:id', async (req, res) => {
  // handler logic
});
```

### `match(method: string, path: string): [[T, Record<string, number>][], string[]]`

Match a route and return handlers with parameters.

**Returns:**
- `[handlers, params]` where:
  - `handlers` - Array of `[handler, paramMap]` tuples
  - `handlers[i][0]` - The handler function/value
  - `handlers[i][1]` - Parameter name to index mapping (e.g., `{id: 0, slug: 1}`)
  - `params` - Array of extracted parameter values
- `[[], []]` - If no match found

```typescript
const [handlers, params] = router.match('GET', '/api/users/123');
if (handlers.length > 0) {
  const handler = handlers[0][0]; // Get first handler
  const paramMap = handlers[0][1]; // Get parameter mapping: {id: 0}
  const userId = params[paramMap.id]; // '123'
}
```

### `prettyPrint(): string`

Print the router tree structure for debugging.

```typescript
console.log(router.prettyPrint());
```

## Usage with HTTP Server

### Node.js

```typescript
import {createServer} from 'http';
import {RadixTree} from '@your-scope/radix-tree-router';

const router = new RadixTree<(req: any, res: any) => void>();

router.add('GET', '/', (req, res) => {
  res.end('Home');
});

router.add('GET', '/users/:id', (req, res) => {
  res.end('User handler');
});

createServer((req, res) => {
  const [handlers, params] = router.match(req.method!, req.url!);
  
  if (handlers.length === 0) {
    res.statusCode = 404;
    res.end('Not Found');
    return;
  }
  
  const handler = handlers[0][0];
  const paramMap = handlers[0][1];
  
  // Access params by name
  if (paramMap.id !== undefined) {
    console.log('User ID:', params[paramMap.id]);
  }
  
  handler(req, res);
}).listen(3000);
```

### Bun

```typescript
import {RadixTree} from '@your-scope/radix-tree-router';

const router = new RadixTree<(req: Request) => Response>();

router.add('GET', '/', () => new Response('Home'));
router.add('GET', '/users/:id', () => new Response('User'));

Bun.serve({
  port: 3000,
  fetch(req) {
    const url = new URL(req.url);
    const [handlers, params] = router.match(req.method, url.pathname);
    
    if (handlers.length === 0) {
      return new Response('Not Found', {status: 404});
    }
    
    return handlers[0][0](req);
  },
});
```

## Parameter Mapping

When routes have named parameters, you can access them by name:

```typescript
router.add('GET', '/posts/:category/:slug', handler);

const [handlers, params] = router.match('GET', '/posts/tech/hello-world');
const paramMap = handlers[0][1]; // {category: 0, slug: 1}

const category = params[paramMap.category]; // 'tech'
const slug = params[paramMap.slug]; // 'hello-world'
```

## Performance

Benchmarked on Node.js v20+ with 1M operations:

| Router | ops/sec | Relative |
|--------|---------|----------|
| hono-regexp-router | 56M | 2.2x |
| koa-tree-router | 35M | 1.4x |
| **radix-tree** | **25M** | **1.0x** |
| find-my-way | 20M | 0.8x |
| hono-trie-router | 6M | 0.24x |

Run benchmarks:

```bash
cd bench
bun install
bun run start:node
```

## How It Works

The router uses a **radix tree** (compressed trie) data structure:

1. **Static segments** are stored in tree nodes
2. **Dynamic parameters** (`:param`) are handled with parametric nodes
3. **Wildcards** (`*`) match remaining path segments
4. **Backtracking** allows multiple route patterns to coexist

Example tree for routes:
- `/users`
- `/users/:id`
- `/users/:id/posts`

```
/
└── users
    ├── [static] → handler
    └── :id [param]
        ├── [static] → handler
        └── /posts [static] → handler
```

## Advanced Features

### Multiple Handlers per Route

```typescript
router.add('GET', '/api/users', middleware1);
router.add('GET', '/api/users', middleware2);
router.add('GET', '/api/users', handler);

const [handlers, params] = router.match('GET', '/api/users');
// handlers = [[middleware1, {}], [middleware2, {}], [handler, {}]]
```

### Route Constraints

```typescript
// Only match numeric IDs
router.add('GET', '/users/:id(\\d+)', handler);

// Only match specific formats
router.add('GET', '/files/:name(.+\\.pdf)', handler);
```

## TypeScript

Full TypeScript support with generics:

```typescript
type Handler = (req: Request, res: Response) => void;

const router = new RadixTree<Handler>();

router.add('GET', '/users/:id', (req, res) => {
  // Fully typed
});
```

## Error Handling

```typescript
const [handlers, params] = router.match('GET', '/unknown');

if (handlers.length === 0) {
  // Route not found
  console.log('404 Not Found');
}
```

## Debugging

Print the router tree:

```typescript
console.log(router.prettyPrint());
```

Output:
```
/
├── users
│   ├── [GET] → handler
│   └── :id
│       └── [GET] → handler
└── static
    └── *
        └── [GET] → handler
```

## Contributing

Contributions welcome! Please open an issue or PR.

## License

MIT

## Credits

Inspired by:
- [find-my-way](https://github.com/delvedor/find-my-way)
- [koa-tree-router](https://github.com/steambap/koa-tree-router)
- [hono](https://github.com/honojs/hono)
