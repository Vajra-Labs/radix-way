import {RadixTree} from './ts';
import FindMyWay from 'find-my-way';

// Test routes configuration
const routes = [
  // Static routes
  {method: 'GET', path: '/', handler: 'root'},
  {method: 'GET', path: '/about', handler: 'about'},
  {method: 'GET', path: '/contact', handler: 'contact'},
  {method: 'GET', path: '/pricing', handler: 'pricing'},

  // User routes with params
  {method: 'GET', path: '/user', handler: 'user-list'},
  {method: 'GET', path: '/user/:id', handler: 'user-get'},
  {method: 'POST', path: '/user/:id', handler: 'user-update'},
  {method: 'DELETE', path: '/user/:id', handler: 'user-delete'},
  {method: 'GET', path: '/user/:id/profile', handler: 'user-profile'},
  {method: 'GET', path: '/user/:id/posts', handler: 'user-posts'},
  {method: 'GET', path: '/user/:id/posts/:postId', handler: 'user-post'},

  // API routes
  {method: 'GET', path: '/api/v1/users', handler: 'api-users'},
  {method: 'GET', path: '/api/v1/users/:id', handler: 'api-user'},
  {method: 'GET', path: '/api/v1/posts', handler: 'api-posts'},
  {method: 'GET', path: '/api/v1/posts/:id', handler: 'api-post'},
  {method: 'GET', path: '/api/v1/posts/:id/comments', handler: 'api-comments'},
  {
    method: 'GET',
    path: '/api/v1/posts/:id/comments/:commentId',
    handler: 'api-comment',
  },

  // Events
  {method: 'GET', path: '/event/:id', handler: 'event-get'},
  {method: 'GET', path: '/event/:id/comments', handler: 'event-comments'},
  {method: 'POST', path: '/event/:id/comment', handler: 'event-comment'},

  // Map locations
  {method: 'GET', path: '/map/:location/events', handler: 'map-events'},

  // Admin routes
  {method: 'GET', path: '/admin/dashboard', handler: 'admin-dashboard'},
  {method: 'GET', path: '/admin/users/:id', handler: 'admin-user'},
  {method: 'GET', path: '/admin/settings', handler: 'admin-settings'},

  // Deep nested routes
  {
    method: 'GET',
    path: '/very/deeply/nested/route/hello/there',
    handler: 'nested',
  },
  {
    method: 'GET',
    path: '/this/is/another/deeply/nested/path',
    handler: 'nested2',
  },

  // Wildcard routes
  {method: 'GET', path: '/static/*', handler: 'static-files'},
  {method: 'GET', path: '/files/*', handler: 'file-server'},

  // Status
  {method: 'GET', path: '/status', handler: 'status'},
  {method: 'GET', path: '/health', handler: 'health'},
];

// Test paths for benchmarking
const testPaths = [
  {method: 'GET', path: '/', name: 'root'},
  {method: 'GET', path: '/about', name: 'static-short'},
  {method: 'GET', path: '/user', name: 'user-list'},
  {method: 'GET', path: '/user/john123', name: 'single-param'},
  {method: 'GET', path: '/user/john123/profile', name: 'param-static'},
  {method: 'GET', path: '/user/john123/posts/post456', name: 'multi-param'},
  {method: 'GET', path: '/api/v1/users', name: 'api-static'},
  {method: 'GET', path: '/api/v1/users/user789', name: 'api-param'},
  {
    method: 'GET',
    path: '/api/v1/posts/post999/comments/comm111',
    name: 'api-nested',
  },
  {method: 'GET', path: '/event/event555', name: 'event'},
  {method: 'POST', path: '/event/event555/comment', name: 'event-post'},
  {method: 'GET', path: '/map/paris/events', name: 'map-location'},
  {method: 'GET', path: '/admin/users/admin999', name: 'admin-param'},
  {
    method: 'GET',
    path: '/very/deeply/nested/route/hello/there',
    name: 'deep-nested',
  },
  {method: 'GET', path: '/static/css/style.css', name: 'wildcard'},
  {method: 'GET', path: '/files/documents/report.pdf', name: 'wildcard-deep'},
  {method: 'GET', path: '/status', name: 'status'},
];

// ============================================
// 1. RADIX ROUTER SETUP
// ============================================
const radixRouter = new RadixTree<string>();
routes.forEach(({method, path, handler}) => {
  radixRouter.add(method, path, handler);
});

// ============================================
// 2. FIND-MY-WAY SETUP
// ============================================
const findMyWay = FindMyWay();
routes.forEach(({method, path, handler}) => {
  findMyWay.on(method as any, path, () => handler);
});

// ============================================
// BENCHMARK UTILITIES
// ============================================

interface BenchmarkResult {
  name: string;
  time: number;
  opsPerSec: number;
  rps: number;
  memUsed: number;
  cpu: number;
}

function benchmark(
  name: string,
  fn: () => void,
  iterations = 1000000,
): BenchmarkResult {
  // Force GC
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
  const cpu = cpuUser + cpuSystem;

  console.log(`${name}:`);
  console.log(`  Time: ${time.toFixed(2)}ms`);
  console.log(`  Ops/sec: ${opsPerSec.toFixed(0)}`);
  console.log(`  RPS: ${rps.toLocaleString()}`);
  console.log(`  Memory: ${memUsed > 0 ? '+' : ''}${memUsed.toFixed(2)} MB`);
  console.log(
    `  CPU: ${cpu.toFixed(2)}ms (user: ${cpuUser.toFixed(2)}ms, sys: ${cpuSystem.toFixed(2)}ms)`,
  );

  return {name, time, opsPerSec, rps, memUsed, cpu};
}

function compareBenchmarks(
  baseline: BenchmarkResult,
  ...others: BenchmarkResult[]
) {
  console.log(`\n📊 Comparison (baseline: **${baseline.name}**):`);

  others.forEach(result => {
    // Only compare if the result is valid
    if (!result) return;

    const timeDiff = ((result.time - baseline.time) / baseline.time) * 100;
    const rpsDiff = ((result.rps - baseline.rps) / baseline.rps) * 100;
    const memDiff = result.memUsed - baseline.memUsed;
    const cpuDiff = result.cpu - baseline.cpu;

    console.log(`\n**${result.name}**:`);
    console.log(
      `  Speed: ${timeDiff > 0 ? '🔴' : '🟢'} ${Math.abs(timeDiff).toFixed(1)}% ${
        timeDiff > 0 ? 'slower' : 'faster'
      }`,
    );
    console.log(
      `  RPS: ${rpsDiff > 0 ? '🟢' : '🔴'} ${Math.abs(rpsDiff).toFixed(1)}% ${
        rpsDiff > 0 ? 'more' : 'less'
      }`,
    );
    console.log(
      `  Memory: ${memDiff > 0 ? '🔴' : '🟢'} ${Math.abs(memDiff).toFixed(2)} MB ${
        memDiff > 0 ? 'more' : 'less'
      }`,
    );
    console.log(
      `  CPU: ${cpuDiff > 0 ? '🔴' : '🟢'} ${Math.abs(cpuDiff).toFixed(2)}ms ${
        cpuDiff > 0 ? 'more' : 'less'
      }`,
    );
  });
}

// ============================================
// RUN BENCHMARKS
// ============================================

console.log('╔═══════════════════════════════════════════════════════╗');
console.log('║     RADIX vs FIND-MY-WAY ROUTER BENCHMARK             ║');
console.log('╚═══════════════════════════════════════════════════════╝\n');

console.log(`📦 Routes: ${routes.length}`);
console.log(`🧪 Test paths: ${testPaths.length}`);
console.log(`🔄 Iterations: 1,000,000 per test`);
console.log(`💾 Run with: node --expose-gc benchmark.ts\n`);

// Warmup
console.log('🔥 Warming up...\n');
for (let i = 0; i < 10000; i++) {
  testPaths.forEach(({method, path}) => {
    radixRouter.match(method, path);
    findMyWay.find(method as any, path);
  });
}

const results: Record<string, BenchmarkResult[]> = {
  radix: [],
  findMyWay: [],
};

// ============================================
// TEST CATEGORIES
// ============================================

console.log('═══════════════════════════════════════════════════════');
console.log('📍 TEST 1: Static Routes');
console.log('═══════════════════════════════════════════════════════\n');

results.radix.push(
  benchmark('RadixRouter', () => radixRouter.match('GET', '/about')),
);
results.findMyWay.push(
  benchmark('find-my-way', () => findMyWay.find('GET', '/about')),
);

compareBenchmarks(results.radix[0], results.findMyWay[0]);

console.log('\n═══════════════════════════════════════════════════════');
console.log('📍 TEST 2: Single Parameter Route');
console.log('═══════════════════════════════════════════════════════\n');

results.radix.push(
  benchmark('RadixRouter', () => radixRouter.match('GET', '/user/john123')),
);
results.findMyWay.push(
  benchmark('find-my-way', () => findMyWay.find('GET', '/user/john123')),
);

compareBenchmarks(results.radix[1], results.findMyWay[1]);

console.log('\n═══════════════════════════════════════════════════════');
console.log('📍 TEST 3: Multiple Parameters Route');
console.log('═══════════════════════════════════════════════════════\n');

results.radix.push(
  benchmark('RadixRouter', () =>
    radixRouter.match('GET', '/user/john123/posts/post456'),
  ),
);
results.findMyWay.push(
  benchmark('find-my-way', () =>
    findMyWay.find('GET', '/user/john123/posts/post456'),
  ),
);

compareBenchmarks(results.radix[2], results.findMyWay[2]);

console.log('\n═══════════════════════════════════════════════════════');
console.log('📍 TEST 4: Deep Nested Static Route');
console.log('═══════════════════════════════════════════════════════\n');

const deepPath = '/very/deeply/nested/route/hello/there';
results.radix.push(
  benchmark('RadixRouter', () => radixRouter.match('GET', deepPath)),
);
results.findMyWay.push(
  benchmark('find-my-way', () => findMyWay.find('GET', deepPath)),
);

compareBenchmarks(results.radix[3], results.findMyWay[3]);

console.log('\n═══════════════════════════════════════════════════════');
console.log('📍 TEST 5: Wildcard Route');
console.log('═══════════════════════════════════════════════════════\n');

results.radix.push(
  benchmark('RadixRouter', () =>
    radixRouter.match('GET', '/static/css/style.css'),
  ),
);
results.findMyWay.push(
  benchmark('find-my-way', () =>
    findMyWay.find('GET', '/static/css/style.css'),
  ),
);

compareBenchmarks(results.radix[4], results.findMyWay[4]);

console.log('\n═══════════════════════════════════════════════════════');
console.log('📍 TEST 6: API Nested Parameters');
console.log('═══════════════════════════════════════════════════════\n');

results.radix.push(
  benchmark('RadixRouter', () =>
    radixRouter.match('GET', '/api/v1/posts/post999/comments/comm111'),
  ),
);
results.findMyWay.push(
  benchmark('find-my-way', () =>
    findMyWay.find('GET', '/api/v1/posts/post999/comments/comm111'),
  ),
);

compareBenchmarks(results.radix[5], results.findMyWay[5]);

console.log('\n═══════════════════════════════════════════════════════');
console.log('📍 TEST 7: All Routes Mixed (Real-World Simulation)');
console.log('═══════════════════════════════════════════════════════\n');

results.radix.push(
  benchmark('RadixRouter', () => {
    testPaths.forEach(({method, path}) => radixRouter.match(method, path));
  }),
);

results.findMyWay.push(
  benchmark('find-my-way', () => {
    testPaths.forEach(({method, path}) => findMyWay.find(method as any, path));
  }),
);

compareBenchmarks(results.radix[6], results.findMyWay[6]);

// ============================================
// FINAL SUMMARY
// ============================================

console.log('\n\n╔═══════════════════════════════════════════════════════╗');
console.log('║                    FINAL SUMMARY                      ║');
console.log('╚═══════════════════════════════════════════════════════╝\n');

// Calculate averages
const calcAvg = (arr: BenchmarkResult[], key: keyof BenchmarkResult) =>
  arr.reduce((sum, r) => sum + (r[key] as number), 0) / arr.length;

const avgRPS = {
  radix: calcAvg(results.radix, 'rps'),
  findMyWay: calcAvg(results.findMyWay, 'rps'),
};

const avgTime = {
  radix: calcAvg(results.radix, 'time'),
  findMyWay: calcAvg(results.findMyWay, 'time'),
};

const avgMem = {
  radix: calcAvg(results.radix, 'memUsed'),
  findMyWay: calcAvg(results.findMyWay, 'memUsed'),
};

console.log('📊 Average Performance Across All Tests:\n');

console.log('┌─────────────────┬──────────────┬──────────────┬──────────────┐');
console.log('│ Router          │ Avg RPS      │ Avg Time(ms) │ Avg Mem(MB)  │');
console.log('├─────────────────┼──────────────┼──────────────┼──────────────┤');
console.log(
  `│ RadixRouter     │ ${avgRPS.radix.toLocaleString().padEnd(12)} │ ${avgTime.radix.toFixed(2).padEnd(12)} │ ${avgMem.radix.toFixed(2).padEnd(12)} │`,
);
console.log(
  `│ find-my-way     │ ${avgRPS.findMyWay.toLocaleString().padEnd(12)} │ ${avgTime.findMyWay.toFixed(2).padEnd(12)} │ ${avgMem.findMyWay.toFixed(2).padEnd(12)} │`,
);
console.log(
  '└─────────────────┴──────────────┴──────────────┴──────────────┘\n',
);

// Rankings
const rankings = [
  {name: 'RadixRouter', rps: avgRPS.radix},
  {name: 'find-my-way', rps: avgRPS.findMyWay},
].sort((a, b) => b.rps - a.rps);

console.log('🏆 Performance Ranking:\n');
rankings.forEach((r, i) => {
  const medal = ['🥇', '🥈'][i];
  const vsFirst =
    i === 0
      ? ''
      : ` (${(((rankings[0].rps - r.rps) / rankings[0].rps) * 100).toFixed(1)}% slower)`;
  console.log(
    `${medal} ${i + 1}. ${r.name}: ${r.rps.toLocaleString()} req/sec${vsFirst}`,
  );
});

console.log('\n✅ Benchmark Complete!\n');
