import findMyWay from 'find-my-way';
import {RadixTree} from '../../dist/index.js';

function createRouters(routeCount) {
  const radixRouter = new RadixTree();
  const fmwRouter = findMyWay();

  // Add many routes
  for (let i = 0; i < routeCount; i++) {
    const path = `/route${i}/:param${i}`;
    radixRouter.add('GET', path, () => {});
    fmwRouter.on('GET', path, () => {});
  }

  return {radixRouter, fmwRouter};
}

function benchmark(name, fn, iterations = 100000) {
  // Warmup
  for (let i = 0; i < 100; i++) fn();

  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const elapsed = performance.now() - start;

  const opsPerSec = (iterations / elapsed) * 1000;
  return {
    name,
    opsPerSec,
    avgTime: elapsed / iterations,
  };
}

console.log('🔥 Stress Test: Large Route Sets\n');
console.log('Testing lookup performance with varying route counts\n');
console.log('='.repeat(70));

[100, 500, 1000].forEach(routeCount => {
  console.log(`\n📊 Testing with ${routeCount} routes:`);

  const {radixRouter, fmwRouter} = createRouters(routeCount);

  // Test lookup at different positions
  const positions = [
    {name: 'First route', path: '/route0/test0'},
    {name: 'Middle route', path: `/route${Math.floor(routeCount / 2)}/test`},
    {name: 'Last route', path: `/route${routeCount - 1}/test`},
  ];

  positions.forEach(({name, path}) => {
    const radixResult = benchmark(`RadixTree - ${name}`, () => {
      radixRouter.match('GET', path);
    });

    const fmwResult = benchmark(`find-my-way - ${name}`, () => {
      fmwRouter.find('GET', path);
    });

    const diff =
      ((radixResult.opsPerSec - fmwResult.opsPerSec) / fmwResult.opsPerSec) *
      100;
    const winner = diff > 0 ? 'RadixTree' : 'find-my-way';
    const percentage = Math.abs(diff).toFixed(2);

    console.log(`\n  ${name}:`);
    console.log(
      `    RadixTree:   ${(radixResult.opsPerSec / 1000000).toFixed(2)}M ops/sec`,
    );
    console.log(
      `    find-my-way: ${(fmwResult.opsPerSec / 1000000).toFixed(2)}M ops/sec`,
    );
    console.log(`    Winner:      ${winner} (${percentage}% faster)`);
  });
});

console.log('\n' + '='.repeat(70));
console.log('\n✨ Stress Test Complete!\n');
