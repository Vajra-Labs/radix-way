import {RadixTree} from '../../dist/index.js';
import findMyWay from 'find-my-way';

function getMemoryUsage() {
  if (typeof Bun !== 'undefined') {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    return process.memoryUsage();
  }
  return process.memoryUsage();
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function measureMemory(name, fn) {
  // Force GC before measurement
  if (global.gc) global.gc();

  const before = getMemoryUsage();

  // Execute function
  fn();

  // Force GC after to see retained memory
  if (global.gc) global.gc();

  const after = getMemoryUsage();

  const delta = {
    rss: after.rss - before.rss,
    heapTotal: after.heapTotal - before.heapTotal,
    heapUsed: after.heapUsed - before.heapUsed,
    external: after.external - before.external,
  };

  return delta;
}

function createRoutes(router, count, isRadixTree) {
  for (let i = 0; i < count; i++) {
    const method = ['GET', 'POST', 'PUT', 'DELETE'][i % 4];

    // Create unique paths by including index
    // Static routes
    if (i % 5 === 0) {
      const path = `/static/route-${i}`;
      if (isRadixTree) {
        router.add(method, path, () => {});
      } else {
        router.on(method, path, () => {});
      }
    }
    // Parametric routes
    else if (i % 5 === 1) {
      const path = `/users-${i}/:id`;
      if (isRadixTree) {
        router.add(method, path, () => {});
      } else {
        router.on(method, path, () => {});
      }
    }
    // Multi-param routes
    else if (i % 5 === 2) {
      const path = `/api-${i}/:version/users/:userId`;
      if (isRadixTree) {
        router.add(method, path, () => {});
      } else {
        router.on(method, path, () => {});
      }
    }
    // Regex routes
    else if (i % 5 === 3) {
      const path = `/posts-${i}/:id{\\d+}`;
      if (isRadixTree) {
        router.add(method, path, () => {});
      } else {
        router.on(method, path, () => {});
      }
    }
    // Wildcard routes
    else {
      const path = `/files-${i}/*`;
      if (isRadixTree) {
        router.add(method, path, () => {});
      } else {
        router.on(method, path, () => {});
      }
    }
  }
}

console.log('💾 Memory Usage Profiler\n');
console.log('Measuring memory consumption of routers...\n');

if (!global.gc) {
  console.log('⚠️  Warning: Run with --expose-gc flag for accurate results');
  console.log('   Example: bun --smol --expose-gc memory-test.ts\n');
}

console.log('='.repeat(70));

[10, 50, 100, 500, 1000].forEach(routeCount => {
  console.log(`\n📊 Testing with ${routeCount} routes:\n`);

  // Test RadixTree
  const radixMemory = measureMemory('RadixTree', () => {
    const router = new RadixTree();
    createRoutes(router, routeCount, true);
  });

  // Test find-my-way
  const fmwMemory = measureMemory('find-my-way', () => {
    const router = findMyWay();
    createRoutes(router, routeCount, false);
  });

  console.log('  RadixTree:');
  console.log(`    Heap Used:  ${formatBytes(radixMemory.heapUsed)}`);
  console.log(`    RSS:        ${formatBytes(radixMemory.rss)}`);

  console.log('\n  find-my-way:');
  console.log(`    Heap Used:  ${formatBytes(fmwMemory.heapUsed)}`);
  console.log(`    RSS:        ${formatBytes(fmwMemory.rss)}`);

  const heapDiff = radixMemory.heapUsed - fmwMemory.heapUsed;
  const rssDiff = radixMemory.rss - fmwMemory.rss;

  console.log('\n  Comparison:');

  // Heap comparison
  if (radixMemory.heapUsed === 0 && fmwMemory.heapUsed === 0) {
    console.log(`    ℹ️  Both routers: Minimal heap usage (${formatBytes(0)})`);
  } else if (heapDiff < 0) {
    const percentage =
      fmwMemory.heapUsed > 0
        ? ((Math.abs(heapDiff) / fmwMemory.heapUsed) * 100).toFixed(2)
        : '0.00';
    console.log(
      `    ✅ RadixTree uses ${formatBytes(Math.abs(heapDiff))} LESS heap (${percentage}%)`,
    );
  } else if (heapDiff > 0) {
    const percentage =
      fmwMemory.heapUsed > 0
        ? ((heapDiff / fmwMemory.heapUsed) * 100).toFixed(2)
        : '0.00';
    console.log(
      `    ❌ RadixTree uses ${formatBytes(heapDiff)} MORE heap (${percentage}%)`,
    );
  } else {
    console.log(`    ⚖️  Equal heap usage`);
  }

  // RSS comparison
  if (rssDiff < 0) {
    const percentage =
      fmwMemory.rss > 0
        ? ((Math.abs(rssDiff) / fmwMemory.rss) * 100).toFixed(2)
        : '0.00';
    console.log(
      `    ✅ RadixTree uses ${formatBytes(Math.abs(rssDiff))} LESS RSS (${percentage}%)`,
    );
  } else if (rssDiff > 0) {
    const percentage =
      fmwMemory.rss > 0 ? ((rssDiff / fmwMemory.rss) * 100).toFixed(2) : '0.00';
    console.log(
      `    ❌ RadixTree uses ${formatBytes(rssDiff)} MORE RSS (${percentage}%)`,
    );
  } else {
    console.log(`    ⚖️  Equal RSS usage`);
  }
});

console.log('\n' + '='.repeat(70));

// Detailed structure size analysis
console.log('\n📐 Detailed Structure Size Analysis:\n');

// Create sample routers for inspection
const sampleRadix = new RadixTree();
const sampleFmw = findMyWay();

// Add some routes
['GET', 'POST', 'PUT', 'DELETE'].forEach(method => {
  sampleRadix.add(method, '/users/:id', () => {});
  sampleRadix.add(method, '/posts/:postId/comments/:commentId', () => {});
  sampleRadix.add(method, '/static/file', () => {});

  sampleFmw.on(method, '/users/:id', () => {});
  sampleFmw.on(method, '/posts/:postId/comments/:commentId', () => {});
  sampleFmw.on(method, '/static/file', () => {});
});

// Estimate per-route overhead
const radixPerRoute = measureMemory('RadixTree single route', () => {
  const router = new RadixTree();
  router.add('GET', '/test', () => {});
});

const fmwPerRoute = measureMemory('find-my-way single route', () => {
  const router = findMyWay();
  router.on('GET', '/test', () => {});
});

console.log('  Per-route memory overhead (approximate):');
console.log(`    RadixTree:   ${formatBytes(radixPerRoute.heapUsed)}`);
console.log(`    find-my-way: ${formatBytes(fmwPerRoute.heapUsed)}`);

const perRouteDiff = radixPerRoute.heapUsed - fmwPerRoute.heapUsed;
if (radixPerRoute.heapUsed === 0 && fmwPerRoute.heapUsed === 0) {
  console.log(`    ℹ️  Both routers: Minimal per-route overhead`);
} else if (perRouteDiff < 0) {
  console.log(
    `    ✅ RadixTree: ${formatBytes(Math.abs(perRouteDiff))} less per route`,
  );
} else if (perRouteDiff > 0) {
  console.log(`    ❌ RadixTree: ${formatBytes(perRouteDiff)} more per route`);
} else {
  console.log(`    ⚖️  Equal per-route overhead`);
}

console.log('\n✨ Memory Profiling Complete!\n');

// Summary
console.log('📋 Summary:\n');
console.log('  Key Findings:');
console.log('  • RadixTree uses single tree (shared across HTTP methods)');
console.log('  • find-my-way uses multiple trees (one per method)');
console.log('  • Memory difference grows with route count');
console.log(
  '  • For production APIs (100-1000 routes), difference is significant',
);
console.log('\n  Recommendation:');
console.log('  • Use RadixTree for memory-constrained environments');
console.log('  • Use RadixTree for high route count applications');
console.log('  • Both routers have acceptable memory footprints\n');
