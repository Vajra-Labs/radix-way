import FindMyWay from 'find-my-way';
import {RadixTree} from './ts';

// Setup routes
const routes = [
  ['GET', '/', 'root'],
  ['GET', '/user', 'user'],
  ['GET', '/user/comments', 'user-comments'],
  ['GET', '/user/lookup/username/:username', 'user-lookup'],
  ['GET', '/user/lookup/email/:email', 'user-email'],
  ['GET', '/event/:id', 'event'],
  ['GET', '/event/:id/comments', 'event-comments'],
  ['POST', '/event/:id/comment', 'event-comment'],
  ['GET', '/map/:location/events', 'map-events'],
  ['GET', '/status', 'status'],
  ['GET', '/very/deeply/nested/route/hello/there', 'nested'],
];

// Test paths
const testPaths = [
  ['GET', '/'],
  ['GET', '/user'],
  ['GET', '/user/comments'],
  ['GET', '/user/lookup/username/john'],
  ['GET', '/user/lookup/email/john@example.com'],
  ['GET', '/event/123'],
  ['GET', '/event/123/comments'],
  ['POST', '/event/456/comment'],
  ['GET', '/map/paris/events'],
  ['GET', '/status'],
  ['GET', '/very/deeply/nested/route/hello/there'],
];

// Setup RadixRouter (Claude's)
const radixRouter = new RadixTree<string>();
routes.forEach(([method, path, handler]) => {
  radixRouter.add(method, path, handler);
});

// Setup FindMyWay
const findMyWay = FindMyWay();
routes.forEach(([method, path, handler]) => {
  findMyWay.on(method as any, path, () => handler);
});

// Benchmark function
function benchmark(name: string, fn: () => void, iterations = 1000000) {
  if (global.gc) global.gc();

  const memBefore = process.memoryUsage();
  const cpuBefore = process.cpuUsage();
  const start = performance.now();

  for (let i = 0; i < iterations; i++) {
    fn();
  }

  const end = performance.now();
  const cpuAfter = process.cpuUsage(cpuBefore);
  const memAfter = process.memoryUsage();

  const time = end - start;
  const opsPerSec = (iterations / time) * 1000;
  const rps = Math.floor(opsPerSec);
  const memUsed = (memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024;
  const cpuUser = cpuAfter.user / 1000;
  const cpuSystem = cpuAfter.system / 1000;

  console.log(`${name}:`);
  console.log(`  Time: ${time.toFixed(2)}ms`);
  console.log(`  Ops/sec: ${opsPerSec.toFixed(0)}`);
  console.log(`  RPS: ${rps.toLocaleString()}`);
  console.log(`  Memory: ${memUsed > 0 ? '+' : ''}${memUsed.toFixed(2)} MB`);
  console.log(`  CPU: ${(cpuUser + cpuSystem).toFixed(2)}ms`);

  return {time, opsPerSec, rps, memUsed, cpu: cpuUser + cpuSystem};
}

console.log('=== Benchmark: Claude RadixRouter vs find-my-way ===\n');
console.log(`Routes: ${routes.length}`);
console.log(`Test paths: ${testPaths.length}`);
console.log(`Iterations: 1,000,000\n`);

// Warmup
for (let i = 0; i < 10000; i++) {
  testPaths.forEach(([method, path]) => {
    radixRouter.match(method, path);
    findMyWay.find(method as any, path);
  });
}

console.log('--- Static Routes ---');
benchmark('RadixRouter', () => radixRouter.match('GET', '/user'));
benchmark('find-my-way', () => findMyWay.find('GET', '/user'));

console.log('\n--- Parametric Routes ---');
benchmark('RadixRouter', () => radixRouter.match('GET', '/event/123'));
benchmark('find-my-way', () => findMyWay.find('GET', '/event/123'));

console.log('\n--- Nested Parametric ---');
benchmark('RadixRouter', () =>
  radixRouter.match('GET', '/user/lookup/username/john'),
);
benchmark('find-my-way', () =>
  findMyWay.find('GET', '/user/lookup/username/john'),
);

console.log('\n--- Deep Nested Static ---');
benchmark('RadixRouter', () =>
  radixRouter.match('GET', '/very/deeply/nested/route/hello/there'),
);
benchmark('find-my-way', () =>
  findMyWay.find('GET', '/very/deeply/nested/route/hello/there'),
);

console.log('\n--- All Routes Mixed ---');
const radixStats = benchmark('RadixRouter', () => {
  testPaths.forEach(([method, path]) => radixRouter.match(method, path));
});
const fmwStats = benchmark('find-my-way', () => {
  testPaths.forEach(([method, path]) => findMyWay.find(method as any, path));
});

console.log(`\n=== Summary ===`);
const timeDiff = ((radixStats.time - fmwStats.time) / fmwStats.time) * 100;
const rpsDiff = ((radixStats.rps - fmwStats.rps) / fmwStats.rps) * 100;
const memDiff = radixStats.memUsed - fmwStats.memUsed;
const cpuDiff = radixStats.cpu - fmwStats.cpu;

console.log(
  `Speed: ${timeDiff > 0 ? '⚠️' : '✅'} ${Math.abs(timeDiff).toFixed(1)}% ${timeDiff > 0 ? 'slower' : 'faster'}`,
);
console.log(
  `RPS: ${rpsDiff > 0 ? '✅' : '⚠️'} ${Math.abs(rpsDiff).toFixed(1)}% ${rpsDiff > 0 ? 'more' : 'less'}`,
);
console.log(
  `Memory: ${memDiff > 0 ? '⚠️' : '✅'} ${Math.abs(memDiff).toFixed(2)} MB ${memDiff > 0 ? 'more' : 'less'}`,
);
console.log(
  `CPU: ${cpuDiff > 0 ? '⚠️' : '✅'} ${Math.abs(cpuDiff).toFixed(2)}ms ${cpuDiff > 0 ? 'more' : 'less'}`,
);
