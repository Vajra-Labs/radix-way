import http from 'http';
import {RadixTree} from './src/index';

type Req = http.IncomingMessage;
type Res = http.ServerResponse<http.IncomingMessage> & {
  req: http.IncomingMessage;
};
type Handler = (req: Req, res: Res) => void;

const router = new RadixTree<Handler>();

router.insert('ALL', '/', (_req, res) => {
  res.end('Welcome to Radix Way!');
});

router.insert('GET', '/json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({message: 'Hello World'}));
});

router.insert('POST', '/users/:id', (req, res) => {
  const result = router.match(req.method!, req.url!);
  const [, paramMap, params] = result!;
  const userId = params?.[paramMap?.id!];
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({userId, name: `User ${userId}`}));
});

router.insert('ALL', '/*', (_req, res) => {
  res.end('Page Not Found!');
});

const app = http.createServer((req, res) => {
  const result = router.match(req.method!, req.url!);
  if (!result) {
    res.statusCode = 404;
    res.end('Not Found');
    return;
  }
  const [handlers] = result;
  handlers?.[0]?.(req, res);
});

app.listen(3000, () => {
  console.log('🚀 Server running at http://localhost:3000');
  console.log('\nRadix-Tree:');
  router.printTree();
});
