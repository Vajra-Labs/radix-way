import findMyWay, {HTTPMethod} from 'find-my-way';
import {RadixTree} from './ts/index.ts';

const routes = [
  ['GET', '/', 'home'],
  ['GET', '/users', 'list-users'],
  ['GET', '/users/:id', 'get-user'],
  ['POST', '/users', 'create-user'],
  ['GET', '/users/:id/posts', 'user-posts'],
  ['GET', '/users/:id/posts/:postId', 'get-post'],
  ['GET', '/users/:id/posts/:postId/comments', 'post-comments'],
  ['GET', '/api/v1/products/:id', 'get-product'],
  ['GET', '/api/v2/products/:id', 'get-product-v2'],
  ['GET', '/files/*', 'serve-files'],
  ['GET', '/static/*', 'serve-static'],
  ['GET', '/search/:query?', 'search'],
  ['GET', '/items/:id(\\\\d+)', 'numeric-item'],
];

console.log('=== find-my-way ===');
const fmw = findMyWay();
routes.forEach(([method, path, handler]) =>
  fmw.on(method as HTTPMethod, path, () => handler),
);
console.log(fmw.prettyPrint());

console.log('\\n=== RadixTree ===');
const rt = new RadixTree();
routes.forEach(([method, path, handler]) => rt.add(method, path, handler));
console.log(rt.prettyPrint());
