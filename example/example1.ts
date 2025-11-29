import {RadixTree} from '../ts';

const router = new RadixTree<string>();

// Global middleware
router.add('ALL', '*', 'global');

// API middleware
router.add('GET', '/api/*', 'api-auth');

// Route-specific middleware + handler
router.add('GET', '/api/users/:id', 'validate');
router.add('GET', '/api/users/:id', 'handler');

console.log('=== Test 1: /api/users/123 ===');
console.dir(router.match('ALL', '/api/users/123'), {depth: null});

console.log(router.prettyPrint());
