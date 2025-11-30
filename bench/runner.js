import {fork} from 'child_process';
import {resolve} from 'path';
import {Queue} from './utils.js';
import chalk from 'chalk';

const benchmarks = [
  {file: 'find-my-way.js', name: 'find-my-way'},
  {file: 'radix-tree.js', name: 'radix-tree'},
  {file: 'koa-tree-router.js', name: 'koa-tree-router'},
  {file: 'hono-regexp-router.js', name: 'hono-regexp-router'},
  {file: 'hono-trie-router.js', name: 'hono-trie-router'}
];

const results = [];
const queue = new Queue();

benchmarks.forEach(bench => {
  queue.add(runner.bind({file: resolve(bench.file), name: bench.name}));
});

function runner(done) {
  const process = fork(this.file, [], {silent: true});
  let output = '';
  
  process.stdout.on('data', (data) => {
    output += data.toString();
    console.log(data.toString().trimEnd());
  });
  
  process.on('close', () => {
    const match = output.match(/all together:.*?([\d,]+) ops\/sec/);
    if (match) {
      results.push({name: this.name, ops: match[1]});
    }
    
    if (results.length === benchmarks.length) {
      showFinalResults();
    }
    done();
  });
}

function showFinalResults() {
  const sorted = results.sort((a, b) => {
    const opsA = parseInt(a.ops.replace(/,/g, ''));
    const opsB = parseInt(b.ops.replace(/,/g, ''));
    return opsB - opsA;
  });
  
  console.log(`\n${chalk.green('='.repeat(17))}`);
  console.log(` ${chalk.bold.white('Final Results')}`);
  console.log(chalk.green('='.repeat(17)));
  
  sorted.forEach((result, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
    const color = i === 0 ? chalk.bold.green : i === 1 ? chalk.yellow : chalk.gray;
    console.log(`  ${medal} ${color(result.name)}: ${chalk.bold(result.ops)} ops/sec`);
  });
  console.log();
}
