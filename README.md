<h1 align="center">⚡ Radix Way</h1>

<p align="center">A high-performance HTTP router using radix tree algorithm for Node.js and Bun.</p>

<p align="center">
  <a href="https://www.npmjs.com/package/radix-way">
    <img src="https://img.shields.io/npm/v/radix-way?color=blue&label=npm" alt="npm version">
  </a>
  <a href="https://www.npmjs.com/package/radix-way">
    <img src="https://img.shields.io/npm/dm/radix-way?color=blue" alt="npm downloads">
  </a>
  <a href="https://github.com/Vajra-Labs/radix-way/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License: MIT">
  </a>
  <a href="https://github.com/Vajra-Labs/radix-way/releases">
    <img src="https://img.shields.io/github/v/release/Vajra-Labs/radix-way?label=Release" alt="Release">
  </a>
  <a href="https://nodejs.org">
    <img src="https://img.shields.io/badge/Node.js-20%2B-green.svg" alt="Node.js Version">
  </a>
  <a href="https://bun.sh">
    <img src="https://img.shields.io/badge/Bun-1.0%2B-black.svg" alt="Bun Version">
  </a>
</p>

<p align="center">
  <a href="#quick-start">🚀 Quick Start</a> •
  <a href="#route-types">📖 Route Types</a> •
  <a href="#api">📚 API</a> •
  <a href="#performance">⚡ Performance</a> •
  <a href="#advanced-features">🔧 Advanced</a> •
  <a href="#whats-different-from-find-my-way">🔍 vs find-my-way</a>
</p>

## Features

- ⚡ **Fast** - 43-118% faster than find-my-way across all route types
- 🪶 **Lightweight** - Zero dependencies
- 🎯 **Flexible** - Static, dynamic, wildcard, and regex routes
- 💾 **Memory Efficient** - 50-78% less memory than find-my-way at scale (500+ routes)
- 🔧 **TypeScript** - Full type safety
- 🌲 **Radix Tree** - Single-tree architecture for optimal memory usage

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Route Types](#route-types)
  - [Static Routes](#static-routes)
  - [Dynamic Routes (Parameters)](#dynamic-routes-parameters)
  - [Wildcard Routes](#wildcard-routes)
  - [Regex Routes](#regex-routes)
  - [Optional Parameters](#optional-parameters)
  - [Regex Pattern Syntax](#regex-pattern-syntax)
- [API](#api)
  - [`new RadixTree<T>()`](#new-radixtreet)
  - [`add(method, path, handler)`](#addmethod-string-path-string-handler-t-void)
  - [`match(method, path)`](#matchmethod-string-path-string-t-paramindexmap-string--null)
  - [`printTree(print?)`](#printtreeprint-boolean-void--string)
- [Usage with HTTP Server](#usage-with-http-server)
  - [Node.js](#nodejs)
  - [Bun](#bun)
- [Parameter Mapping](#parameter-mapping)
- [Performance](#performance)
  - [Speed Comparison](#speed-comparison)
  - [Memory Usage](#memory-usage-500-routes)
  - [Run Benchmarks](#run-benchmarks)
- [Architecture](#architecture)
  - [Single-Tree vs Multi-Tree Design](#single-tree-vs-multi-tree-design)
- [How It Works](#how-it-works)
- [Advanced Features](#advanced-features)
  - [Route Constraints](#route-constraints)
  - [Multi-Parameter Routes](#multi-parameter-routes)
    - [Separator Support](#separator-support)
    - [With Regex Constraints](#with-regex-constraints)
    - [With Static Text](#with-static-text)
    - [Limitations](#limitations)
  - [ALL Method Support](#all-method-support)
- [TypeScript](#typescript)
- [Error Handling](#error-handling)
  - [Regex Pattern Validation](#regex-pattern-validation)
  - [Complex Pattern Examples](#complex-pattern-examples)
- [Debugging](#debugging)
- [What's Different from find-my-way?](#whats-different-from-find-my-way)
- [Contributing](#contributing)
- [License](#license)
- [Credits](#credits)

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

### `printTree(print?: boolean): void | string`

Print the router tree structure for debugging.

**Parameters:**

- `print` - When `true` (default), logs to console and returns `void`. When `false`, returns the string representation.

```typescript
// Print to console (default)
router.printTree();
router.printTree(true);

// Get as string
const treeStr = router.printTree(false);
console.log(treeStr);
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

Define multiple parameters in a single path segment using separators:

#### Separator Support

✅ **Fully Supported:**

1. **Dash (`-`)** - `/time/:hour-:minute` → `{hour: "14", minute: "30"}`
2. **Dot (`.`)** - `/file.:name.:ext` → `{name: "config", ext: "json"}`
3. **Mixed (`-` and `.`)** - `/api/:a-:b.:c` → 3 params with different separators
4. **With Regex** - `/date/:y{\d{4}}-:m{\d{2}}` → Validates while extracting params
5. **With Static Text** - `/files/:name{[a-z]+}.min.:ext` → Static text between params
6. **Multiple Params** - `/ip/:a.:b.:c.:d` → 4+ params in same segment

❌ **Not Supported:**

- Underscore (`_`), At (`@`), or any other custom separators
- These are treated as part of the parameter name, not separators

**Only `-` (dash) and `.` (dot) are supported as multi-param separators.**

```typescript
// Dash separator
router.add('GET', '/time/:hour-:minute', timeHandler);
router.match('GET', '/time/14-30');
// Returns: [timeHandler, {hour: 0, minute: 1}, ['14', '30']]

// Dot separator
router.add('GET', '/file.:name.:ext', fileHandler);
router.match('GET', '/file.config.json');
// Returns: [fileHandler, {name: 0, ext: 1}, ['config', 'json']]

// Multiple params in same segment
router.add('GET', '/date/:year-:month-:day', dateHandler);
router.match('GET', '/date/2024-12-28');
// Returns: [dateHandler, {year: 0, month: 1, day: 2}, ['2024', '12', '28']]

// Mixed separators (dash and dot)
router.add('GET', '/api/:version.:endpoint-:id', apiHandler);
router.match('GET', '/api/v2.users-123');
// Returns: [apiHandler, {version: 0, endpoint: 1, id: 2}, ['v2', 'users', '123']]
```

#### With Regex Constraints

Combine multi-params with regex validation:

```typescript
// Date format validation
router.add('GET', '/date/:year{\\d{4}}-:month{\\d{2}}-:day{\\d{2}}', handler);
router.match('GET', '/date/2024-12-28'); // ✅ matches
router.match('GET', '/date/24-12-28'); // ❌ null (year must be 4 digits)

// Version numbers
router.add('GET', '/v/:major{\\d+}.:minor{\\d+}.:patch{\\d+}', versionHandler);
router.match('GET', '/v/1.2.3'); // ✅ matches

// IP address
router.add(
  'GET',
  '/ip/:a{\\d{1,3}}.:b{\\d{1,3}}.:c{\\d{1,3}}.:d{\\d{1,3}}',
  ipHandler,
);
router.match('GET', '/ip/192.168.1.1'); // ✅ matches
```

#### With Static Text

Mix static text with multi-params:

```typescript
// Static text between params
router.add('GET', '/files/:name{[a-z]+}.min.:ext', handler);
router.match('GET', '/files/app.min.js'); // ✅ {name: 'app', ext: 'js'}
router.match('GET', '/files/app.js'); // ❌ null (missing .min.)

// Image dimensions
router.add('GET', '/img-:width{\\d+}x:height{\\d+}.png', imgHandler);
router.match('GET', '/img-800x600.png'); // ✅ {width: '800', height: '600'}

// API versioning with prefix
router.add('GET', '/api/v:version.:endpoint', apiHandler);
router.match('GET', '/api/v2.users'); // ✅ {version: '2', endpoint: 'users'}
```

#### Limitations

- **Other separators not supported**: `_`, `@`, or custom characters won't work as multi-param separators
- **Example**: `/user/:first_:last` treats `first_:last` as a single parameter name, not two params
- **Workaround**: Use separate segments: `/user/:first/:last` or supported separators: `/user/:first-:last`

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
// Print to console
router.printTree();

// Or get as string
const tree = router.printTree(false);
console.log(tree);
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
