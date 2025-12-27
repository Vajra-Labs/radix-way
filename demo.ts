import {RadixTree} from './src/index';

const routes = [
  // Basic routes
  ['GET', '/home', 'home'],
  ['GET', '/about', 'about'],
  ['GET', '/contact', 'contact'],

  // User routes with multiple methods
  ['GET', '/users', 'list-users'],
  ['POST', '/users', 'create-user'],
  ['GET', '/users/:id', 'get-user'],
  ['PUT', '/users/:id', 'update-user'],
  ['DELETE', '/users/:id', 'delete-user'],
  ['PATCH', '/users/:id', 'patch-user'],

  // Nested parametric routes
  ['GET', '/users/:userId/posts', 'user-posts'],
  ['POST', '/users/:userId/posts', 'create-post'],
  ['GET', '/users/:userId/posts/:postId', 'get-post'],
  ['PUT', '/users/:userId/posts/:postId', 'update-post'],
  ['DELETE', '/users/:userId/posts/:postId', 'delete-post'],
  ['GET', '/users/:userId/posts/:postId/comments', 'post-comments'],
  ['POST', '/users/:userId/posts/:postId/comments', 'create-comment'],
  ['GET', '/users/:userId/posts/:postId/comments/:commentId', 'get-comment'],

  // API versioning
  ['GET', '/api/v1/products', 'v1-list-products'],
  ['GET', '/api/v1/products/:id', 'v1-get-product'],
  ['POST', '/api/v1/products', 'v1-create-product'],
  ['GET', '/api/v2/products', 'v2-list-products'],
  ['GET', '/api/v2/products/:id', 'v2-get-product'],
  ['POST', '/api/v2/products', 'v2-create-product'],
  ['GET', '/api/v3/products/:id/reviews', 'v3-product-reviews'],

  // Wildcard routes
  ['GET', '/files/*', 'serve-files'],
  ['GET', '/static/*', 'serve-static'],
  ['GET', '/assets/*', 'serve-assets'],

  // Optional parameters
  ['GET', '/search/:query?', 'search'],
  ['GET', '/blog/:slug?', 'blog'],

  // Regex parameters
  ['GET', '/posts/action/:action{create|update}', 'create|update'],
  ['GET', '/posts/:id{\\d+}', 'numeric-post'],
  ['GET', '/articles/:slug{[a-z0-9-]+}', 'article-by-slug'],
  ['GET', '/categories/:name{[a-z]+}', 'category'],
  [
    'GET',
    '/users/:email{[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}}',
    'user-by-email',
  ],

  // Advanced regex patterns
  [
    'GET',
    '/uuid/:id{[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}}',
    'uuid-resource',
  ],
  ['GET', '/color/:hex{#[0-9a-fA-F]{6}}', 'hex-color'],
  ['GET', '/version/:semver{\\d+\\.\\d+\\.\\d+}', 'semver'],
  ['GET', '/ip/:address{(?:\\d{1,3}\\.){3}\\d{1,3}}', 'ip-address'],

  // Multi-parameters
  ['GET', '/at/:hour-:minute', 'time'],
  ['GET', '/date/:year-:month-:day', 'date'],
  ['GET', '/file.:name.:ext', 'file'],

  // Complex nested
  ['GET', '/org/:orgId/team/:teamId/project/:projectId', 'project'],
  ['GET', '/org/:orgId/team/:teamId/project/:projectId/tasks', 'tasks'],
  ['POST', '/org/:orgId/team/:teamId/project/:projectId/tasks', 'create-task'],

  // Admin routes
  ['GET', '/admin/dashboard', 'admin-dashboard'],
  ['GET', '/admin/users', 'admin-users'],
  ['GET', '/admin/users/:id', 'admin-user-detail'],
  ['GET', '/admin/settings', 'admin-settings'],
  ['POST', '/admin/settings', 'admin-update-settings'],
];

const rt = new RadixTree<string>();
routes.forEach(([method, path, handler]) => rt.add(method, path, handler));

console.log('🌲 Router Tree Structure:\n');
rt.printTree();

console.log('\n📊 Router Statistics:');
console.log(`  Total routes: ${routes.length}`);
console.log(`  Unique paths: ${new Set(routes.map(r => r[1])).size}`);
console.log(`  Methods used: ${new Set(routes.map(r => r[0])).size}`);

console.log('\n🔍 Sample Route Matches:\n');

// Test basic routes
console.log('Basic Routes:');
console.log('  GET /about:', rt.match('GET', '/about')?.[0]);
console.log('  POST /users:', rt.match('POST', '/users')?.[0]);

// Test parametric routes
console.log('\nParametric Routes:');
const userMatch = rt.match('GET', '/users/123');
console.log('  GET /users/123:', userMatch?.[0], '| params:', userMatch?.[2]);

const postMatch = rt.match('GET', '/users/42/posts/99');
console.log(
  '  GET /users/42/posts/99:',
  postMatch?.[0],
  '| params:',
  postMatch?.[2],
);

// Test regex routes
console.log('\nRegex Routes:');
const action = rt.match('GET', '/posts/action/update');
console.log('  GET /posts/action:', action?.[0], '| params:', action?.[2]);
const numericPost = rt.match('GET', '/posts/456');
console.log(
  '  GET /posts/456:',
  numericPost?.[0],
  '| params:',
  numericPost?.[2],
);

const slugMatch = rt.match('GET', '/articles/hello-world-2024');
console.log(
  '  GET /articles/hello-world-2024:',
  slugMatch?.[0],
  '| params:',
  slugMatch?.[2],
);

const emailMatch = rt.match('GET', '/users/test@example.com');
console.log(
  '  GET /users/test@example.com:',
  emailMatch?.[0],
  '| params:',
  emailMatch?.[2],
);

// Test advanced regex
console.log('\nAdvanced Regex Routes:');
const uuidMatch = rt.match('GET', '/uuid/550e8400-e29b-41d4-a716-446655440000');
console.log('  GET /uuid/[uuid]:', uuidMatch?.[0], '| matched:', !!uuidMatch);

const colorMatch = rt.match('GET', '/color/#FF5733');
console.log(
  '  GET /color/#FF5733:',
  colorMatch?.[0],
  '| params:',
  colorMatch?.[2],
);

const semverMatch = rt.match('GET', '/version/1.2.3');
console.log(
  '  GET /version/1.2.3:',
  semverMatch?.[0],
  '| params:',
  semverMatch?.[2],
);

const ipMatch = rt.match('GET', '/ip/192.168.1.1');
console.log('  GET /ip/192.168.1.1:', ipMatch?.[0], '| params:', ipMatch?.[2]);

// Test wildcard routes
console.log('\nWildcard Routes:');
const fileMatch = rt.match('GET', '/files/docs/readme.md');
console.log(
  '  GET /files/docs/readme.md:',
  fileMatch?.[0],
  '| params:',
  fileMatch?.[2],
);

// Test optional params
console.log('\nOptional Parameters:');
const searchNoQuery = rt.match('GET', '/search');
console.log(
  '  GET /search:',
  searchNoQuery?.[0],
  '| params:',
  searchNoQuery?.[2],
);

const searchWithQuery = rt.match('GET', '/search/javascript');
console.log(
  '  GET /search/javascript:',
  searchWithQuery?.[0],
  '| params:',
  searchWithQuery?.[2],
);

// Test multi-params
console.log('\nMulti-Parameter Routes:');
const timeMatch = rt.match('GET', '/at/14-30');
console.log('  GET /at/14-30:', timeMatch?.[0], '| params:', timeMatch?.[2]);

const dateMatch = rt.match('GET', '/date/2024-12-25');
console.log(
  '  GET /date/2024-12-25:',
  dateMatch?.[0],
  '| params:',
  dateMatch?.[2],
);

// Test non-matching routes
console.log('\nNon-Matching Routes (should be null):');
console.log('  GET /posts/abc (not numeric):', rt.match('GET', '/posts/abc'));
console.log('  GET /nonexistent:', rt.match('GET', '/nonexistent'));
console.log(
  '  GET /color/#GGGGGG (invalid hex):',
  rt.match('GET', '/color/#GGGGGG'),
);

console.log('\n✅ Demo completed!');
