import {RadixTree} from '../src';

// Context type (similar to Express req/res or Hono Context)
interface Context {
  req: {
    method: string;
    path: string;
    params: Record<string, string>;
    headers: Record<string, string>;
  };
  res: {
    status: number;
    body: any;
    headers: Record<string, string>;
  };
  state: Record<string, any>; // For passing data between middleware
}

// Middleware function type
type Middleware = (ctx: Context, next: () => Promise<void>) => Promise<void>;

// Router wrapper class
class ExpressStyleRouter {
  private router = new RadixTree<Middleware>();

  // Add middleware/handler
  use(path: string, middleware: Middleware): void;
  use(middleware: Middleware): void;
  use(pathOrMiddleware: string | Middleware, middleware?: Middleware): void {
    if (typeof pathOrMiddleware === 'function') {
      // Global middleware: use('*', middleware)
      this.router.add('ALL', '*', pathOrMiddleware);
    } else {
      // Path-specific middleware
      this.router.add('ALL', pathOrMiddleware, middleware!);
    }
  }

  get(path: string, ...handlers: Middleware[]): void {
    handlers.forEach(handler => this.router.add('GET', path, handler));
  }

  post(path: string, ...handlers: Middleware[]): void {
    handlers.forEach(handler => this.router.add('POST', path, handler));
  }

  put(path: string, ...handlers: Middleware[]): void {
    handlers.forEach(handler => this.router.add('PUT', path, handler));
  }

  delete(path: string, ...handlers: Middleware[]): void {
    handlers.forEach(handler => this.router.add('DELETE', path, handler));
  }

  // Handle incoming request
  async handle(
    method: string,
    path: string,
    headers: Record<string, string> = {},
  ): Promise<Context> {
    // Create context
    const ctx: Context = {
      req: {
        method,
        path,
        params: {},
        headers,
      },
      res: {
        status: 200,
        body: null,
        headers: {},
      },
      state: {},
    };

    // Match route for method-specific handlers
    const methodResult = this.router.match(method, path);
    // Match route for ALL (middleware)
    const allResult = this.router.match('ALL', path);

    // Combine handlers from ALL and method-specific routes
    const allHandlers: Middleware[] = [];
    const allParams: Record<string, string> = {};

    if (allResult) {
      const [handlers, params] = allResult;
      handlers.forEach(([handler, paramIndices]) => {
        allHandlers.push(handler);
        // Build params
        for (const [key, idx] of Object.entries(paramIndices)) {
          allParams[key] = params[idx];
        }
      });
    }

    if (methodResult) {
      const [handlers, params] = methodResult;
      handlers.forEach(([handler, paramIndices]) => {
        allHandlers.push(handler);
        // Build params
        for (const [key, idx] of Object.entries(paramIndices)) {
          allParams[key] = params[idx];
        }
      });
    }

    // Set params in context
    ctx.req.params = allParams;

    if (allHandlers.length === 0) {
      ctx.res.status = 404;
      ctx.res.body = {error: 'Not Found'};
      return ctx;
    }

    // Execute middleware chain
    let currentIndex = 0;

    const next = async (): Promise<void> => {
      if (currentIndex < allHandlers.length) {
        const handler = allHandlers[currentIndex++];
        await handler(ctx, next);
      }
    };

    await next();

    return ctx;
  }
}

// ============================================
// EXAMPLE USAGE
// ============================================

const app = new ExpressStyleRouter();

// 1. Global logger middleware
app.use(async (ctx, next) => {
  console.log(`📝 [${ctx.req.method}] ${ctx.req.path}`);
  await next();
  console.log(`✅ Response: ${ctx.res.status}`);
});

// 2. Performance timing middleware
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  ctx.res.headers['X-Response-Time'] = `${duration}ms`;
  console.log(`⏱️  Duration: ${duration}ms`);
});

// 3. Auth middleware for /api/* routes
app.use('/api/*', async (ctx, next) => {
  const token = ctx.req.headers['authorization'];

  if (!token) {
    ctx.res.status = 401;
    ctx.res.body = {error: 'Unauthorized'};
    return; // Don't call next() - stop the chain
  }

  // Simulate token validation
  ctx.state.user = {id: '123', name: 'John Doe'};
  console.log('🔐 Auth passed');
  await next();
});

// 4. Route-specific middleware + handler
app.get(
  '/api/users/:id',
  // Middleware: Check if user can access this resource
  async (ctx, next) => {
    console.log(`🛡️  Checking access for user ${ctx.req.params.id}`);
    await next();
  },
  // Final handler
  async (ctx, next) => {
    const userId = ctx.req.params.id;
    ctx.res.body = {
      id: userId,
      name: 'John Doe',
      authenticatedAs: ctx.state.user?.name,
    };
    console.log(`👤 Fetched user: ${userId}`);
    await next();
  },
);

// 5. POST route with validation middleware
app.post(
  '/api/users',
  // Validate request body
  async (ctx, next) => {
    // In real scenario, you'd get body from request
    const isValid = true;
    if (!isValid) {
      ctx.res.status = 400;
      ctx.res.body = {error: 'Invalid request body'};
      return;
    }
    console.log('✔️  Validation passed');
    await next();
  },
  // Create user
  async (ctx, next) => {
    ctx.res.status = 201;
    ctx.res.body = {id: '999', name: 'New User'};
    console.log('➕ User created');
    await next();
  },
);

// 6. Public route (no auth required)
app.get('/health', async (ctx, next) => {
  ctx.res.body = {status: 'OK'};
  console.log('💚 Health check');
  await next();
});

// 7. Wildcard file serving
app.get('/static/*', async (ctx, next) => {
  const filePath = ctx.req.params['*'];
  ctx.res.body = {file: filePath};
  console.log(`📁 Serving file: ${filePath}`);
  await next();
});

// ============================================
// RUN EXAMPLES
// ============================================

async function runExample() {
  console.log('🚀 Express-Style Router with Middleware\n');

  // Test 1: Successful API request
  console.log('\n=== Test 1: GET /api/users/456 (with auth) ===');
  let result = await app.handle('GET', '/api/users/456', {
    authorization: 'Bearer token123',
  });
  console.log('Response:', JSON.stringify(result.res, null, 2));

  // Test 2: Unauthorized request
  console.log('\n=== Test 2: GET /api/users/789 (no auth) ===');
  result = await app.handle('GET', '/api/users/789');
  console.log('Response:', JSON.stringify(result.res, null, 2));

  // Test 3: POST request
  console.log('\n=== Test 3: POST /api/users (with auth) ===');
  result = await app.handle('POST', '/api/users', {
    authorization: 'Bearer token123',
  });
  console.log('Response:', JSON.stringify(result.res, null, 2));

  // Test 4: Public route
  console.log('\n=== Test 4: GET /health (no auth needed) ===');
  result = await app.handle('GET', '/health');
  console.log('Response:', JSON.stringify(result.res, null, 2));

  // Test 5: Static file
  console.log('\n=== Test 5: GET /static/images/logo.png ===');
  result = await app.handle('GET', '/static/images/logo.png');
  console.log('Response:', JSON.stringify(result.res, null, 2));
}

runExample();
