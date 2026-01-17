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

- ⚡ **High Performance** - Up to 14x faster than find-my-way with optimized Map-based static routes
- 🪶 **Zero Dependencies** - Minimal footprint, no external dependencies
- 🎯 **Flexible Routing** - Supports static, dynamic, wildcard, and regex routes
- 🎨 **Advanced Patterns** - Multi-parameters, optional params, regex constraints
- 🔗 **Middleware Support** - Multiple handlers per route for middleware chains
- 🔧 **TypeScript Support** - Full type safety with generics
- 💾 **Memory Efficient** - Map-based storage for optimal memory usage at scale
- 📖 **Well Documented** - Comprehensive examples and guides

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
  - [`insert(method, path, handler)`](#insertmethod-string-path-string-handler-t-void)
  - [`match(method, path)`](#matchmethod-string-path-string-t-paramindexmap-string--null)
  - [`printTree()`](#printtree-void)
  - [`routeToRegExp(pattern)`](#routetoregexppattern-string-regexp-paramindexmap)
- [Usage with HTTP Server](#usage-with-http-server)
  - [Node.js](#nodejs)
  - [Bun](#bun)
- [Parameter Mapping](#parameter-mapping)
- [Performance](#performance)
  - [Speed Comparison](#speed-comparison)
  - [Run Benchmarks](#run-benchmarks)
- [How It Works](#how-it-works)
- [Advanced Features](#advanced-features)
  - [Middleware Support](#middleware-support)
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
router.insert('GET', '/users', () => 'List users');
router.insert('GET', '/users/:id', () => 'Get user');
router.insert('GET', '/files/*', () => 'Serve files');

// Match routes
const result = router.match('GET', '/users/123');
if (result) {
  const [handlers, paramMap, params] = result;
  console.log(handlers); // [() => 'Get user']
  console.log(paramMap); // {id: 0}
  console.log(params); // ['123']
}
```

## Route Types

### Static Routes

```typescript
router.insert('GET', '/about', handler);
router.insert('POST', '/login', handler);
```

### Dynamic Routes (Parameters)

```typescript
router.insert('GET', '/users/:id', handler);
router.insert('GET', '/posts/:category/:slug', handler);

const result = router.match('GET', '/users/42');
// result = [[handler], {id: 0}, ['42']]
```

### Wildcard Routes

```typescript
router.insert('GET', '/static/*', handler);

const result = router.match('GET', '/static/css/style.css');
// result = [[handler], {'*': 0}, ['css/style.css']]
```

### Regex Routes

```typescript
// Match only numeric IDs
router.insert('GET', '/users/:id{\\d+}', handler);

// Match slug pattern
router.insert('GET', '/posts/:slug{[a-z0-9-]+}', handler);

// Match with static suffix
router.insert('GET', '/files/:name.jpg', handler);
```

### Optional Parameters

```typescript
router.insert('GET', '/posts/:id?', handler);
// Matches both /posts and /posts/123
```

### Regex Pattern Syntax

Use `{regex}` syntax to add validation constraints to parameters:

```typescript
// Basic patterns
router.insert('GET', '/users/:id{\\d+}', handler); // Digits only
router.insert('GET', '/posts/:slug{[a-z-]+}', handler); // Lowercase + hyphens

// Character classes
router.insert('GET', '/hex/:color{[0-9a-fA-F]+}', handler); // Hexadecimal

// Quantifiers
router.insert('GET', '/code/:id{[A-Z]{3}\\d{4}}', handler); // ABC1234 format
router.insert('GET', '/slug/:name{[a-z]{3,10}}', handler); // 3-10 chars

// Alternation (OR)
router.insert('GET', '/media/:type{image|video|audio}', handler);
router.insert('GET', '/file.:ext{jpg|png|gif}', handler);

// Groups (non-capturing)
router.insert(
  'GET',
  '/date/:d{\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])}',
  handler,
);

// Real-world patterns
router.insert('GET', '/user/:email{[\\w.+-]+@[\\w.-]+\\.\\w+}', handler);
router.insert('GET', '/post/:slug{[a-z0-9]+(?:-[a-z0-9]+)*}', handler);

// Multiple regex params
router.insert('GET', '/api/v:version{\\d+}/users/:id{\\d+}', handler);
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

### `insert(method: string, path: string, handler: T): void`

Add a route to the router. Multiple handlers can be added to the same route for middleware chains.

**Parameters:**

- `method` - HTTP method (GET, POST, PUT, DELETE, etc.) or 'ALL' for all methods
- `path` - Route path
- `handler` - Handler function or any value

```typescript
// Single handler
router.insert('GET', '/api/users/:id', async (req, res) => {
  // handler logic
});

// Multiple handlers (middleware pattern)
router.insert('GET', '/api/users', authMiddleware);
router.insert('GET', '/api/users', loggingMiddleware);
router.insert('GET', '/api/users', usersHandler);

// Match all HTTP methods
router.insert('ALL', '/api/health', healthCheckHandler);
```

### `match(method: string, path: string): T[] | [T[], ParamIndexMap, string[]] | null`

Match a route and return handlers with parameters.

**Returns:**

- **Static routes**: `[handler1, handler2, ...]` - Direct handler array for optimal performance
- **Dynamic routes**: `[handlers, paramMap, params]` - Full tuple with parameter information:
  - `handlers` - Array of handler functions/values (supports middleware chains)
  - `paramMap` - Parameter name to index mapping (e.g., `{id: 0, slug: 1}`)
  - `params` - Array of extracted parameter values
- `null` - If no match found

```typescript
// Static route example
const staticResult = router.match('GET', '/users');
if (staticResult && !Array.isArray(staticResult[0])) {
  // Direct handler access for static routes
  staticResult[0](req, res);
}

// Dynamic route example
const dynamicResult = router.match('GET', '/api/users/123');
if (dynamicResult && Array.isArray(dynamicResult[0])) {
  const [handlers, paramMap, params] = dynamicResult;
  const userId = params[paramMap.id]; // '123'
  handlers[0](req, res);
}

// Universal handling
const result = router.match('GET', '/some/path');
if (result) {
  if (Array.isArray(result[0])) {
    // Dynamic route
    const [handlers] = result;
    handlers[0](req, res);
  } else {
    // Static route
    result[0](req, res);
  }
}
  }
}
```

### `printTree(): void`

Print the router tree structure for debugging. Shows both static routes (stored in Map) and dynamic routes (stored in radix tree).

```typescript
router.printTree();
```

**Output Format:**
- **Static Routes (Map)** - Lists all static routes with their HTTP methods
- **Dynamic Routes (Tree)** - Shows the radix tree structure for dynamic routes

### `routeToRegExp(pattern: string): [RegExp, ParamIndexMap]`

Utility function to convert route patterns to regular expressions with parameter mapping.

**Parameters:**

- `pattern` - Route pattern string (e.g., `/users/:id{\\d+}`)

**Returns:**

- `[RegExp, ParamIndexMap]` - Tuple containing compiled regex and parameter index mapping

```typescript
import {routeToRegExp} from 'radix-way';

// Simple parameter
const [regex1, params1] = routeToRegExp('/users/:id');
console.log(regex1); // /^\/users\/([^/]+)\/?$/
console.log(params1); // {id: 0}

// With regex constraint
const [regex2, params2] = routeToRegExp('/users/:id{\\d+}');
console.log(regex2); // /^\/users\/(\d+)\/?$/
console.log(params2); // {id: 0}

// Multiple parameters
const [regex3, params3] = routeToRegExp('/posts/:category/:slug');
console.log(regex3); // /^\/posts\/([^/]+)\/([^/]+)\/?$/
console.log(params3); // {category: 0, slug: 1}

// Wildcard
const [regex4, params4] = routeToRegExp('/static/*');
console.log(regex4); // /^\/static\/(.*)\/?$/
console.log(params4); // {'*': 0}

// Test the regex
const match = regex1.exec('/users/123');
if (match) {
  const userId = match[params1.id + 1]; // '123'
  console.log('User ID:', userId);
}
```

## Usage with HTTP Server

### Node.js

```typescript
import {createServer} from 'http';
import {RadixTree} from 'radix-way';

const router = new RadixTree<(req: any, res: any) => void>();

router.insert('GET', '/', (req, res) => {
  res.end('Welcome to Radix Way!');
});

router.insert('GET', '/users/:id', (req, res) => {
  res.end('User handler');
});

createServer((req, res) => {
  const result = router.match(req.method!, req.url!);
  
  if (!result) {
    res.statusCode = 404;
    res.end('Not Found');
    return;
  }
  
  // Handle both static and dynamic routes
  if (Array.isArray(result[0])) {
    // Dynamic route - [handlers[], paramMap, params]
    const [handlers] = result;
    handlers[0](req, res);
  } else {
    // Static route - handlers[]
    result[0](req, res);
  }
}).listen(3000, () => {
  console.log('🚀 Server running at http://localhost:3000');
});
  if (paramMap.id !== undefined) {
    console.log('User ID:', params[paramMap.id]);
  }

  // Execute handler(s)
  handlers[0](req, res);
}).listen(3000);
```

### Bun

```typescript
import {RadixTree} from 'radix-way';

const router = new RadixTree<(req: Request) => Response>();

router.insert('GET', '/', () => new Response('Welcome to Radix Way!'));

router.insert('GET', '/users/:id', () => new Response('User handler'));

Bun.serve({
  port: 3000,
  fetch(req) {
    const url = new URL(req.url);
    const result = router.match(req.method, url.pathname);

    if (!result) {
      return new Response('Not Found', {status: 404});
    }

    // Handle both static and dynamic routes
    if (Array.isArray(result[0])) {
      // Dynamic route
      const [handlers] = result;
      return handlers[0](req);
    } else {
      // Static route
      return result[0](req);
    }
  },
});
```

## Parameter Mapping

When routes have named parameters, you can access them by name:

```typescript
router.insert('GET', '/posts/:category/:slug', handler);

const result = router.match('GET', '/posts/tech/hello-world');
if (result) {
  const [handlers, paramMap, params] = result;
  const category = params[paramMap.category]; // 'tech'
  const slug = params[paramMap.slug]; // 'hello-world'
}
```

## Performance

Benchmarked against find-my-way (Node.js v24+):

**Test Environment:**

- **CPU:** Apple M4
- **RAM:** 16 GB
- **OS:** macOS 26.1 (Build 25B78)
- **Node.js:** v24.11.1
- **npm:** 11.6.2

### Speed Comparison

| Route Type             | radix-way     | find-my-way | Performance      |
| ---------------------- | ------------- | ----------- | ---------------- |
| Short Static           | 150.9M ops/s  | 50.2M ops/s | +201% faster 🚀  |
| Static with Same Radix | 160.5M ops/s  | 16.4M ops/s | +879% faster 🔥  |
| Dynamic Route          | 14.5M ops/s   | 8.9M ops/s  | +63% faster ⚡   |
| Mixed Static Dynamic   | 13.7M ops/s   | 10.8M ops/s | +27% faster ✅   |
| Long Static            | 166.9M ops/s  | 11.4M ops/s | +1364% faster 💪 |
| Wildcard               | 24.5M ops/s   | 13.0M ops/s | +88% faster ⚡   |
| All Together           | 4.9M ops/s    | 1.9M ops/s  | +158% faster 🎯  |

**Key Highlights:**

- **Static routes** are exceptionally fast due to optimized Map-based storage with direct handler access
- **Memory efficient** - Map data structure provides better memory management for large applications
- **Consistently faster** than find-my-way in all scenarios, with 2.6x overall performance improvement

### Run Benchmarks

```bash
# Run benchmarks with Bun
bun run bench:bun

# Run benchmarks with Node.js
bun run bench:node
```

## How It Works

The router uses a **radix tree** (compressed trie) data structure:

1. **Static routes** are stored in a Map for O(1) lookup performance
2. **Dynamic routes** use radix tree nodes with optimized prefix matching
3. **Dynamic parameters** (`:param`) are handled with parametric nodes
4. **Wildcards** (`*`) match remaining path segments
5. **Backtracking** allows multiple route patterns to coexist

## Advanced Features

### Middleware Support

Add multiple handlers to the same route to create middleware chains:

```typescript
const router = new RadixTree<(req: any, res: any, next?: () => void) => void>();

// Add middleware handlers to the same route
router.insert('GET', '/api/users', authMiddleware);
router.insert('GET', '/api/users', loggingMiddleware);
router.insert('GET', '/api/users', usersHandler);

const result = router.match('GET', '/api/users');
if (result) {
  const [handlers, paramMap, params] = result;

  // Execute all handlers in sequence
  for (const handler of handlers) {
    await handler(req, res);
  }

  // Or execute with next() pattern
  let idx = 0;
  const next = () => {
    if (idx < handlers.length) {
      handlers[idx++](req, res, next);
    }
  };
  next();
}
```

### Route Constraints

Use regex patterns with `{}` syntax to validate parameters:

```typescript
// Only match numeric IDs
router.insert('GET', '/users/:id{\\d+}', handler);

// Match email addresses
router.insert(
  'GET',
  '/user/:email{[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}}',
  emailHandler,
);

// UUID pattern
router.insert(
  'GET',
  '/resource/:uuid{[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}}',
  uuidHandler,
);

// Hex color pattern
router.insert('GET', '/color/:hex{#[0-9a-fA-F]{6}}', colorHandler);

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
router.insert('GET', '/time/:hour-:minute', timeHandler);
router.match('GET', '/time/14-30');
// Returns: [timeHandler, {hour: 0, minute: 1}, ['14', '30']]

// Dot separator
router.insert('GET', '/file.:name.:ext', fileHandler);
router.match('GET', '/file.config.json');
// Returns: [fileHandler, {name: 0, ext: 1}, ['config', 'json']]

// Multiple params in same segment
router.insert('GET', '/date/:year-:month-:day', dateHandler);
router.match('GET', '/date/2024-12-28');
// Returns: [dateHandler, {year: 0, month: 1, day: 2}, ['2024', '12', '28']]

// Mixed separators (dash and dot)
router.insert('GET', '/api/:version.:endpoint-:id', apiHandler);
router.match('GET', '/api/v2.users-123');
// Returns: [apiHandler, {version: 0, endpoint: 1, id: 2}, ['v2', 'users', '123']]
```

#### With Regex Constraints

Combine multi-params with regex validation:

```typescript
// Date format validation
router.insert(
  'GET',
  '/date/:year{\\d{4}}-:month{\\d{2}}-:day{\\d{2}}',
  handler,
);
router.match('GET', '/date/2024-12-28'); // ✅ matches
router.match('GET', '/date/24-12-28'); // ❌ null (year must be 4 digits)

// Version numbers
router.insert(
  'GET',
  '/v/:major{\\d+}.:minor{\\d+}.:patch{\\d+}',
  versionHandler,
);
router.match('GET', '/v/1.2.3'); // ✅ matches

// IP address
router.insert(
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
router.insert('GET', '/files/:name{[a-z]+}.min.:ext', handler);
router.match('GET', '/files/app.min.js'); // ✅ {name: 'app', ext: 'js'}
router.match('GET', '/files/app.js'); // ❌ null (missing .min.)

// Image dimensions
router.insert('GET', '/img-:width{\\d+}x:height{\\d+}.png', imgHandler);
router.match('GET', '/img-800x600.png'); // ✅ {width: '800', height: '600'}

// API versioning with prefix
router.insert('GET', '/api/v:version.:endpoint', apiHandler);
router.match('GET', '/api/v2.users'); // ✅ {version: '2', endpoint: 'users'}
```

#### Limitations

- **Other separators not supported**: `_`, `@`, or custom characters won't work as multi-param separators
- **Example**: `/user/:first_:last` treats `first_:last` as a single parameter name, not two params
- **Workaround**: Use separate segments: `/user/:first/:last` or supported separators: `/user/:first-:last`

### ALL Method Support

Handle all HTTP methods with a single route:

```typescript
router.insert('ALL', '/api/health', healthCheck);

// Matches any method
router.match('GET', '/api/health'); // ✅ matches
router.match('POST', '/api/health'); // ✅ matches
router.match('DELETE', '/api/health'); // ✅ matches

// Specific methods override ALL
router.insert('ALL', '/api/users', allHandler);
router.insert('GET', '/api/users', getHandler);

router.match('GET', '/api/users'); // Returns getHandler
router.match('POST', '/api/users'); // Returns allHandler
```

## TypeScript

Full TypeScript support with generics:

```typescript
type Handler = (req: Request, res: Response) => void;

const router = new RadixTree<Handler>();

router.insert('GET', '/users/:id', (req, res) => {
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

const [handlers, paramMap, params] = result;
// Handle the request...
```

### Regex Pattern Validation

Routes with regex patterns only match valid formats:

```typescript
const router = new RadixTree();
router.insert('GET', '/users/:id{\\d+}', handler);

// Invalid format - returns null
const r1 = router.match('GET', '/users/abc');
console.log(r1); // null

// Valid - returns handlers
const r2 = router.match('GET', '/users/123');
console.log(r2); // [[handler], {id: 0}, ['123']]
```

### Complex Pattern Examples

```typescript
// Date pattern (YYYY-MM-DD)
router.insert(
  'GET',
  '/date/:year{\\d{4}}-:month{\\d{2}}-:day{\\d{2}}',
  dateHandler,
);
router.match('GET', '/date/2024-12-25'); // ✅ matches

// Semantic version (X.Y.Z)
router.insert('GET', '/version/:semver{\\d+\\.\\d+\\.\\d+}', versionHandler);
router.match('GET', '/version/1.2.3'); // ✅ matches

// IP address
router.insert('GET', '/ip/:addr{(?:\\d{1,3}\\.){3}\\d{1,3}}', ipHandler);
router.match('GET', '/ip/192.168.1.1'); // ✅ matches

// File extension with alternation
router.insert('GET', '/file/:name.:ext{json|xml|txt}', fileHandler);
router.match('GET', '/file/config.json'); // ✅ matches
router.match('GET', '/file/data.pdf'); // ❌ null
```

## Debugging

Print the router tree to visualize route structure:

```typescript
const router = new RadixTree();

// Add some routes
router.insert('GET', '/users', handler);
router.insert('GET', '/about', handler);
router.insert('GET', '/users/:id', handler);
router.insert('POST', '/users/:id/posts', handler);
router.insert('GET', '/static/*', handler);

// Print to console
router.printTree();
```

Output:

```
┌─ Static Routes (Map)
│  /users [GET]
│  /about [GET]
│
└─ Dynamic Routes (Tree)
   <root>
   ├─ users/
   │  └─ :id [GET]
   │     └─ /posts [POST]
   └─ static/
      └─ * [GET]
```

## What's Different from find-my-way?

While both routers use radix trees, there are key architectural differences:

| Feature            | RadixTree                       | find-my-way                       |
| ------------------ | ------------------------------- | --------------------------------- |
| Tree Structure     | Single tree (path-first)        | Multiple trees (method-first)     |
| Performance        | Up to 14x faster                | Baseline                          |
| Optimization       | Pre-compiled regex + Map lookup | Loop-based matching               |
| Middleware Support | Multiple handlers per route     | Single handler per route          |
| Route Constraints  | Regex patterns with {} syntax   | Built-in constraints & versioning |

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
router.insert('GET', '/users/:id', (req, res) => {});
const result = router.match('GET', '/users/123');
if (result) {
  const [handlers, paramMap, params] = result;
  console.log(params[paramMap.id]);
  handlers[0](req, res);
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
