import express from 'express';
import {title, now, print, operations} from '../utils.js';

const app = express();
const router = express.Router();

title('express benchmark');

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
  {method: 'GET', url: '/static/*splat'},
];

function noop(req, res, next) {
  next && next();
}

let i = 0;
let time = 0;

routes.forEach(route => {
  if (route.method === 'GET') {
    router.get(route.url, noop);
  } else {
    router.post(route.url, noop);
  }
});

app.use(router);

// Create mock request and response objects
function createMockReq(method, url) {
  return {
    method,
    url,
    headers: {},
    params: {},
    query: {},
  };
}

function createMockRes() {
  return {
    statusCode: 200,
    setHeader: () => {},
    end: () => {},
    json: () => {},
  };
}

time = now();
for (i = 0; i < operations; i++) {
  router.handle(createMockReq('GET', '/user'), createMockRes(), noop);
}
print('short static:', time);

time = now();
for (i = 0; i < operations; i++) {
  router.handle(createMockReq('GET', '/user/comments'), createMockRes(), noop);
}
print('static with same radix:', time);

time = now();
for (i = 0; i < operations; i++) {
  router.handle(
    createMockReq('GET', '/user/lookup/username/john'),
    createMockRes(),
    noop,
  );
}
print('dynamic route:', time);

time = now();
for (i = 0; i < operations; i++) {
  router.handle(
    createMockReq('GET', '/event/abcd1234/comments'),
    createMockRes(),
    noop,
  );
}
print('mixed static dynamic:', time);

time = now();
for (i = 0; i < operations; i++) {
  router.handle(
    createMockReq('GET', '/very/deeply/nested/route/hello/there'),
    createMockRes(),
    noop,
  );
}
print('long static:', time);

time = now();
for (i = 0; i < operations; i++) {
  router.handle(
    createMockReq('GET', '/static/index.html'),
    createMockRes(),
    noop,
  );
}
print('wildcard:', time);

time = now();
for (i = 0; i < operations; i++) {
  router.handle(createMockReq('GET', '/user'), createMockRes(), noop);
  router.handle(createMockReq('GET', '/user/comments'), createMockRes(), noop);
  router.handle(
    createMockReq('GET', '/user/lookup/username/john'),
    createMockRes(),
    noop,
  );
  router.handle(
    createMockReq('GET', '/event/abcd1234/comments'),
    createMockRes(),
    noop,
  );
  router.handle(
    createMockReq('GET', '/very/deeply/nested/route/hello/there'),
    createMockRes(),
    noop,
  );
  router.handle(
    createMockReq('GET', '/static/index.html'),
    createMockRes(),
    noop,
  );
}
print('all together:', time);
