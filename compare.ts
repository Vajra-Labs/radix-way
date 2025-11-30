import findMyWay, {HTTPMethod} from 'find-my-way';
import {RadixTree} from './ts/index.ts';

const routes = [
  // Basic routes
  ['POST', '/', 'home'],
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
  ['GET', '/posts/:id(\\\\d+)', 'numeric-post'],
  ['GET', '/articles/:slug([a-z0-9-]+)', 'article-by-slug'],
  ['GET', '/categories/:name([a-z]+)', 'category'],
  [
    'GET',
    '/users/:email([a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,})',
    'test@example.com',
  ],

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

console.log('=== find-my-way ===');
const fmw = findMyWay();
routes.forEach(([method, path, handler]) =>
  fmw.on(method as HTTPMethod, path, () => handler),
);
console.log(fmw.prettyPrint());

console.log('\n=== RadixTree ===');
const rt = new RadixTree();
routes.forEach(([method, path, handler]) => rt.add(method, path, handler));
console.log(rt.prettyPrint());

console.log('\n=== Route Count ===');
console.log(`Total routes: ${routes.length}`);
console.log(`Unique paths: ${new Set(routes.map(r => r[1])).size}`);
console.log(`Methods used: ${new Set(routes.map(r => r[0])).size}`);
