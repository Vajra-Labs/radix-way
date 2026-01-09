import {addRoute, createRouter} from 'rou3';
import {compileRouter} from 'rou3/compiler';
import {title, now, print, operations} from '../utils.js';

const router = createRouter();

title('rou3-compiled benchmark');

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
  addRoute(router, route.method, route.url, noop);
});

// Compile the router for maximum performance
const compiledFind = compileRouter(router);

time = now();
for (i = 0; i < operations; i++) {
  compiledFind('GET', '/user');
}
print('short static:', time);

time = now();
for (i = 0; i < operations; i++) {
  compiledFind('GET', '/user/comments');
}
print('static with same radix:', time);

time = now();
for (i = 0; i < operations; i++) {
  compiledFind('GET', '/user/lookup/username/john');
}
print('dynamic route:', time);

time = now();
for (i = 0; i < operations; i++) {
  compiledFind('GET', '/event/abcd1234/comments');
}
print('mixed static dynamic:', time);

time = now();
for (i = 0; i < operations; i++) {
  compiledFind('GET', '/very/deeply/nested/route/hello/there');
}
print('long static:', time);

time = now();
for (i = 0; i < operations; i++) {
  compiledFind('GET', '/static/index.html');
}
print('wildcard:', time);

time = now();
for (i = 0; i < operations; i++) {
  compiledFind('GET', '/user');
  compiledFind('GET', '/user/comments');
  compiledFind('GET', '/user/lookup/username/john');
  compiledFind('GET', '/event/abcd1234/comments');
  compiledFind('GET', '/very/deeply/nested/route/hello/there');
  compiledFind('GET', '/static/index.html');
}
print('all together:', time);
