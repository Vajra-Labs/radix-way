# radix-way

A high-performance HTTP router using radix tree algorithm for Node.js and Bun.

## Features

- ⚡ **Fast** - 43-118% faster than find-my-way across all route types
- 🪶 **Lightweight** - Zero dependencies (only ansis for pretty print)
- 🎯 **Flexible** - Static, dynamic, wildcard, and regex routes
- 💾 **Memory Efficient** - 50-78% less memory than find-my-way at scale (500+ routes)
- 🔧 **TypeScript** - Full type safety
- 🌲 **Radix Tree** - Single-tree architecture for optimal memory usage

## Installation

```bash
npm install radix-way
# or
bun add radix-way
```

## Quick Start

```typescript
import {RadixTree} from 'radix-way';

const router = new RadixTree();

// Add routes
router.add('GET', '/users', () => 'List users');
router.add('GET', '/users/:id', () => 'Get user');
router.add('GET', '/files/*', () => 'Serve files');

// Match routes
const result = router.match('GET', '/users/123');
if (result) {
  const [handler, paramMap, params] = result;
  console.log(handler); // () => 'Get user'
  console.log(paramMap); // {id: 0}
  console.log(params); // ['123']
}
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

const result = router.match('GET', '/users/42');
// result = [handler, {id: 0}, ['42']]
```

### Wildcard Routes

```typescript
router.add('GET', '/static/*', handler);

const result = router.match('GET', '/static/css/style.css');
// result = [handler, {'*': 0}, ['css/style.css']]
```

### Regex Routes

```typescript
// Match only numeric IDs
router.add('GET', '/users/:id{\\d+}', handler);

// Match slug pattern
router.add('GET', '/posts/:slug{[a-z0-9-]+}', handler);

// Match with static suffix
router.add('GET', '/files/:name.jpg', handler);
```

### Optional Parameters

```typescript
router.add('GET', '/posts/:id?', handler);
// Matches both /posts and /posts/123
```

### Regex Pattern Syntax

Use `{regex}` syntax to add validation constraints to parameters:

```typescript
// Basic patterns
router.add('GET', '/users/:id{\\d+}', handler); // Digits only
router.add('GET', '/posts/:slug{[a-z-]+}', handler); // Lowercase + hyphens

// Character classes
router.add('GET', '/hex/:color{[0-9a-fA-F]+}', handler); // Hexadecimal

// Quantifiers
router.add('GET', '/code/:id{[A-Z]{3}\\d{4}}', handler); // ABC1234 format
router.add('GET', '/slug/:name{[a-z]{3,10}}', handler); // 3-10 chars

// Alternation (OR)
router.add('GET', '/media/:type{image|video|audio}', handler);
router.add('GET', '/file.:ext{jpg|png|gif}', handler);

// Groups (non-capturing)
router.add(
  'GET',
  '/date/:d{\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])}',
  handler,
);

// Real-world patterns
router.add('GET', '/user/:email{[\\w.+-]+@[\\w.-]+\\.\\w+}', handler);
router.add('GET', '/post/:slug{[a-z0-9]+(?:-[a-z0-9]+)*}', handler);

// Multiple regex params
router.add('GET', '/api/v:version{\\d+}/users/:id{\\d+}', handler);
```

**Important Notes:**

- Use `\\` for escaping (JavaScript string escaping required)
- Regex is applied to the parameter value only, not the full path
- Use non-capturing groups `(?:...)` for grouping without capture
- The router automatically wraps your pattern in a capturing group

## API

### `new RadixTree<T>()`

Create a new router instance.

```typescript
const router = new RadixTree<Handler>();
```

### `add(method: string, path: string, handler: T): void`

Add a route to the router.

**Parameters:**

- `method` - HTTP method (GET, POST, PUT, DELETE, etc.) or 'ALL' for all methods
- `path` - Route path
- `handler` - Handler function or any value

```typescript
router.add('GET', '/api/users/:id', async (req, res) => {
  // handler logic
});

// Match all HTTP methods
router.add('ALL', '/api/health', healthCheckHandler);
```

### `match(method: string, path: string): [T, ParamIndexMap, string[]] | null`

Match a route and return handler with parameters.

**Returns:**

- `[handler, paramMap, params]` - If match found:
  - `handler` - The handler function/value
  - `paramMap` - Parameter name to index mapping (e.g., `{id: 0, slug: 1}`)
  - `params` - Array of extracted parameter values
- `null` - If no match found

```typescript
const result = router.match('GET', '/api/users/123');
if (result) {
  const [handler, paramMap, params] = result;
  const userId = params[paramMap.id]; // '123'
  await handler(req, res);
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
import {RadixTree} from 'radix-way';

const router = new RadixTree<(req: any, res: any) => void>();

router.add('GET', '/', (req, res) => {
  res.end('Home');
});

router.add('GET', '/users/:id', (req, res) => {
  res.end('User handler');
});

createServer((req, res) => {
  const result = router.match(req.method!, req.url!);

  if (!result) {
    res.statusCode = 404;
    res.end('Not Found');
    return;
  }

  const [handler, paramMap, params] = result;

  // Access params by name
  if (paramMap.id !== undefined) {
    console.log('User ID:', params[paramMap.id]);
  }

  handler(req, res);
}).listen(3000);
```

### Bun

```typescript
import {RadixTree} from 'radix-way';

const router = new RadixTree<(req: Request) => Response>();

router.add('GET', '/', () => new Response('Home'));
router.add('GET', '/users/:id', () => new Response('User'));

Bun.serve({
  port: 3000,
  fetch(req) {
    const url = new URL(req.url);
    const result = router.match(req.method, url.pathname);

    if (!result) {
      return new Response('Not Found', {status: 404});
    }

    const [handler] = result;
    return handler(req);
  },
});
```

## Parameter Mapping

When routes have named parameters, you can access them by name:

```typescript
router.add('GET', '/posts/:category/:slug', handler);

const result = router.match('GET', '/posts/tech/hello-world');
if (result) {
  const [handler, paramMap, params] = result;
  const category = params[paramMap.category]; // 'tech'
  const slug = params[paramMap.slug]; // 'hello-world'
}
```

## Performance

Benchmarked against find-my-way (Node.js v20+):

**Test Environment:**

- **CPU:** Apple M4
- **RAM:** 16 GB
- **OS:** macOS 26.1 (Build 25B78)
- **Node.js:** v24.11.1
- **npm:** 11.6.2

### Speed Comparison

| Route Type          | RadixTree   | find-my-way | Performance         |
| ------------------- | ----------- | ----------- | ------------------- |
| Short Static Routes | 52.9M ops/s | 33.8M ops/s | **+57% faster** ✅  |
| Long Static Routes  | 23.8M ops/s | 10.9M ops/s | **+118% faster** ✅ |
| Parametric Routes   | 12.8M ops/s | 8.8M ops/s  | **+46% faster** ✅  |
| Wildcard Routes     | 20.9M ops/s | 14.0M ops/s | **+50% faster** ✅  |
| Mixed Workload      | 3.0M ops/s  | 2.1M ops/s  | **+43% faster** ✅  |

**Why is RadixTree faster?**

- **Single-tree architecture** - Path-first approach with methods at leaf nodes
- **Better prefix compression** - Shared prefixes stored once across all HTTP methods
- **Dynamic code generation** - Uses `new Function()` to create optimized inline comparisons with zero loop overhead
- **JIT-friendly** - Generated code is highly optimizable by JavaScript engines (V8/JavaScriptCore)
- **Lower overhead** - No regex validation or parameter length checks in hot paths

### Memory Usage (500 routes)

| Router        | RSS Memory  | Heap Used |
| ------------- | ----------- | --------- |
| **RadixTree** | **0.53 MB** | **66 KB** |
| find-my-way   | 2.97 MB     | 141 KB    |
| **Savings**   | **82%**     | **53%**   |

### Run Benchmarks

```bash
cd bench
bun install
bun run bench      # Speed benchmarks
bun run memory     # Memory profiling
```

## Architecture

### Single-Tree vs Multi-Tree Design

**RadixTree uses a single-tree, path-first architecture:**

- One radix tree for all HTTP methods
- Methods stored at leaf nodes alongside handlers
- Optimal for memory efficiency and complex routes

**find-my-way uses multi-tree, method-first architecture:**

- Separate tree for each HTTP method (GET, POST, PUT, etc.)
- Direct method lookup but slower overall performance
- Higher memory usage due to tree duplication

**Trade-offs:**

| Aspect                        | RadixTree (Single Tree) | find-my-way (Multi Tree) |
| ----------------------------- | ----------------------- | ------------------------ |
| Short static routes           | ✅ Faster (+57%)        | Slower                   |
| Long/complex routes           | ✅ Faster (+118%)       | Slower                   |
| Parametric routes             | ✅ Faster (+46%)        | Slower                   |
| Memory at scale (500+ routes) | ✅ 82% less RSS         | Higher                   |
| CPU cache locality            | ✅ Excellent            | Good                     |
| Prefix sharing                | ✅ Excellent            | None (duplicated)        |

**Choose RadixTree when:**

- You need the fastest router overall
- Building large-scale applications (100+ routes)
- Memory efficiency matters
- Routes have complex patterns (long paths, many params)

**Choose find-my-way when:**

- You need advanced features (constraints, versioning)
- You prefer the method-first architecture
- Ecosystem compatibility matters

## How It Works

The router uses a **radix tree** (compressed trie) data structure:

1. **Static segments** are stored in tree nodes with `Object.create(null)` for zero overhead
2. **Prefix matching** uses dynamically generated code (`new Function()`) for optimal performance
3. **Dynamic parameters** (`:param`) are handled with parametric nodes
4. **Wildcards** (`*`) match remaining path segments
5. **Backtracking** allows multiple route patterns to coexist
6. **Single tree** stores all methods, reducing memory duplication

Example tree for routes:

- `GET /users`
- `GET /users/:id`
- `POST /users/:id/posts`

```
/
└── users
    ├── [GET] → handler
    └── :id [param]
        ├── [GET] → handler
        └── /posts [POST] → handler
```

## Advanced Features

### Route Constraints

Use regex patterns with `{}` syntax to validate parameters:

```typescript
// Only match numeric IDs
router.add('GET', '/users/:id{\\d+}', handler);

// Match email addresses
router.add(
  'GET',
  '/user/:email{[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}}',
  emailHandler,
);

// UUID pattern
router.add(
  'GET',
  '/resource/:uuid{[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}}',
  uuidHandler,
);

// Hex color pattern
router.add('GET', '/color/:hex{#[0-9a-fA-F]{6}}', colorHandler);

// Won't match - returns null
router.match('GET', '/users/abc'); // null (not numeric)
router.match('GET', '/user/invalid'); // null (not email)
router.match('GET', '/color/#GGGGGG'); // null (invalid hex)
```

**Why use `{}` instead of `()`?**

- Clearer syntax separation between router syntax `{}` and regex content
- No ambiguity with regex capturing groups
- Simpler parsing and better error messages
- Compatible with Hono-style routing patterns

### Multi-Parameter Routes

Multiple parameters in a single segment:

```typescript
// Date/time format: /at/14-30
router.add('GET', '/at/:hour-:minute', timeHandler);

// File with extension: /file.readme.md
router.add('GET', '/file.:name.:ext', fileHandler);

const result = router.match('GET', '/at/14-30');
// result = [timeHandler, {hour: 0, minute: 1}, ['14', '30']]
```

### ALL Method Support

Handle all HTTP methods with a single route:

```typescript
router.add('ALL', '/api/health', healthCheck);

// Matches any method
router.match('GET', '/api/health'); // ✅ matches
router.match('POST', '/api/health'); // ✅ matches
router.match('DELETE', '/api/health'); // ✅ matches

// Specific methods override ALL
router.add('ALL', '/api/users', allHandler);
router.add('GET', '/api/users', getHandler);

router.match('GET', '/api/users'); // Returns getHandler
router.match('POST', '/api/users'); // Returns allHandler
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

The router returns `null` when no route matches:

```typescript
const result = router.match('GET', '/unknown');

if (!result) {
  // Route not found
  console.log('404 Not Found');
  return;
}

const [handler, paramMap, params] = result;
// Handle the request...
```

### Regex Pattern Validation

Routes with regex patterns only match valid formats:

```typescript
const router = new RadixTree();
router.add('GET', '/users/:id{\\d+}', handler);

// Invalid format - returns null
const r1 = router.match('GET', '/users/abc');
console.log(r1); // null

// Valid - returns handler
const r2 = router.match('GET', '/users/123');
console.log(r2); // [handler, {id: 0}, ['123']]
```

### Complex Pattern Examples

```typescript
// Date pattern (YYYY-MM-DD)
router.add(
  'GET',
  '/date/:year{\\d{4}}-:month{\\d{2}}-:day{\\d{2}}',
  dateHandler,
);
router.match('GET', '/date/2024-12-25'); // ✅ matches

// Semantic version (X.Y.Z)
router.add('GET', '/version/:semver{\\d+\\.\\d+\\.\\d+}', versionHandler);
router.match('GET', '/version/1.2.3'); // ✅ matches

// IP address
router.add('GET', '/ip/:addr{(?:\\d{1,3}\\.){3}\\d{1,3}}', ipHandler);
router.match('GET', '/ip/192.168.1.1'); // ✅ matches

// File extension with alternation
router.add('GET', '/file/:name.:ext{json|xml|txt}', fileHandler);
router.match('GET', '/file/config.json'); // ✅ matches
router.match('GET', '/file/data.pdf'); // ❌ null
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

## What's Different from find-my-way?

While both routers use radix trees, there are key architectural differences:

| Feature              | RadixTree                       | find-my-way                       |
| -------------------- | ------------------------------- | --------------------------------- |
| Tree Structure       | Single tree (path-first)        | Multiple trees (method-first)     |
| Memory at 500 routes | 66 KB heap (0.53 MB RSS)        | 141 KB heap (2.97 MB RSS)         |
| Performance          | 43-118% faster across all types | Baseline                          |
| Optimization         | Dynamic code generation         | Loop-based matching               |
| Best For             | All applications                | Advanced routing features         |
| Route Registration   | Single handler per route        | Supports constraints & versioning |

**Migration from find-my-way:**

```typescript
// find-my-way
const router = FindMyWay();
router.on('GET', '/users/:id', (req, res, params) => {
  console.log(params.id);
});
const match = router.find('GET', '/users/123');

// RadixTree
const router = new RadixTree();
router.add('GET', '/users/:id', (req, res) => {});
const result = router.match('GET', '/users/123');
if (result) {
  const [handler, paramMap, params] = result;
  console.log(params[paramMap.id]);
}
```

## Contributing

Contributions welcome! Please open an issue or PR.

## License

MIT

## Credits

Inspired by and compared against:

- [find-my-way](https://github.com/delvedor/find-my-way) - Multi-tree method-first router
- [koa-tree-router](https://github.com/steambap/koa-tree-router) - Koa radix tree router
- [hono](https://github.com/honojs/hono) - Ultrafast web framework
