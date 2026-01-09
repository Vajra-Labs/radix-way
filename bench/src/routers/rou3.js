import {addRoute, createRouter, findRoute} from 'rou3';
import {title, now, print, operations} from '../utils.js';

const ctx = createRouter();

title('rou3 benchmark');

const routes = [
  {method: 'GET', url: '/user'},
  {method: 'GET', url: '/user/comments'},
  {method: 'GET', url: '/user/avatar'},
  {method: 'GET', url: '/user/lookup/username/:username'},
  {method: 'GET', url: '/user/lookup/email/:address'},
  {method: 'GET', url: '/event/:id'},
  {method: 'GET', url: '/event/:id/comments'},
  {method: 'POST', url: '/event/:id/comment'},
  {method: 'GET', url: '/map/:location/events'},
  {method: 'GET', url: '/status'},
  {method: 'GET', url: '/very/deeply/nested/route/hello/there'},
  {method: 'GET', url: '/static/*'},
];

function noop() {}

let i = 0;
let time = 0;

routes.forEach(route => {
  addRoute(ctx, route.method, route.url, noop);
});

time = now();
for (i = 0; i < operations; i++) {
  findRoute(ctx, 'GET', '/user');
}
print('short static:', time);

time = now();
for (i = 0; i < operations; i++) {
  findRoute(ctx, 'GET', '/user/comments');
}
print('static with same radix:', time);

time = now();
for (i = 0; i < operations; i++) {
  findRoute(ctx, 'GET', '/user/lookup/username/john');
}
print('dynamic route:', time);

time = now();
for (i = 0; i < operations; i++) {
  findRoute(ctx, 'GET', '/event/abcd1234/comments');
}
print('mixed static dynamic:', time);

time = now();
for (i = 0; i < operations; i++) {
  findRoute(ctx, 'GET', '/very/deeply/nested/route/hello/there');
}
print('long static:', time);

time = now();
for (i = 0; i < operations; i++) {
  findRoute(ctx, 'GET', '/static/index.html');
}
print('wildcard:', time);

time = now();
for (i = 0; i < operations; i++) {
  findRoute(ctx, 'GET', '/user');
  findRoute(ctx, 'GET', '/user/comments');
  findRoute(ctx, 'GET', '/user/lookup/username/john');
  findRoute(ctx, 'GET', '/event/abcd1234/comments');
  findRoute(ctx, 'GET', '/very/deeply/nested/route/hello/there');
  findRoute(ctx, 'GET', '/static/index.html');
}
print('all together:', time);
