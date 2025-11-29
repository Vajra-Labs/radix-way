import {RadixTree} from './ts';

const router = new RadixTree<string>();

// Basic routes
router.add('GET', '/users', 'getUsers');
router.add('GET', '/users/:id', 'getUserById');
router.add('GET', '/users/:id/posts/:postId', 'getUserPost');
router.add('GET', '/static/*', 'serveStatic');
router.add('GET', '/posts/:id(\\d+)', 'getPostById');

// Middleware - multiple handlers on same route
router.add('GET', '/api/users/:id', 'auth-middleware');
router.add('GET', '/api/users/:id', 'validate-middleware');
router.add('GET', '/api/users/:id', 'getUserHandler');

// POST routes
router.add('POST', '/users', 'createUser');
router.add('POST', '/api/users/:id', 'updateUser');

console.log('=== Static route ===');
const r0 = router.match('GET', '/users');
console.log('Handler:', r0[0][0][0], 'ParamMap:', r0[0][0][1]);

console.log('\n=== Parametric route ===');
const r1 = router.match('GET', '/users/123');
console.log('Handler:', r1[0][0][0], 'ParamMap:', r1[0][0][1]);
console.log('Params:', r1[1], '→ id =', r1[1][r1[0][0][1].id]);

console.log('\n=== Nested parametric ===');
const r2 = router.match('GET', '/users/123/posts/456');
console.log('Handler:', r2[0][0][0], 'ParamMap:', r2[0][0][1]);
console.log(
  'Params:',
  r2[1],
  '→ id =',
  r2[1][r2[0][0][1].id],
  ', postId =',
  r2[1][r2[0][0][1].postId],
);

console.log('\n=== Wildcard ===');
const r3 = router.match('GET', '/static/css/main.css');
console.log('Handler:', r3[0][0][0], 'ParamMap:', r3[0][0][1]);
console.log('Params:', r3[1], '→ * =', r3[1][r3[0][0][1]['*']]);

console.log('\n=== Regex parametric ===');
const r4 = router.match('GET', '/posts/789');
console.log('Handler:', r4[0][0][0], 'ParamMap:', r4[0][0][1]);

console.log('\n=== Middleware (multiple handlers) ===');
const r5 = router.match('GET', '/api/users/999');
r5[0].forEach(([handler, paramMap]) => {
  console.log('  -', handler, 'ParamMap:', paramMap);
});
console.log('Params:', r5[1]);

console.log('\n=== Not found ===');
console.log(router.match('GET', '/notfound'));

console.log('\n\n╔═══════════════════════════════════════════════════════╗');
console.log('║                   PRETTY PRINT                        ║');
console.log('╚═══════════════════════════════════════════════════════╝\n');

console.log('=== All Methods ===');
console.log(router.prettyPrint());

console.log('\n=== GET Only ===');
console.log(router.prettyPrint('GET'));

console.log('\n=== POST Only ===');
console.log(router.prettyPrint('POST'));
