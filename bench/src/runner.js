import {resolve, dirname} from 'path';
import {fileURLToPath} from 'url';
import {Queue} from './utils.js';
import {fork} from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const benchmarks = [
  'radix-tree.js',
  'radix-tree-lru.js',
  'find-my-way.js',
  'express.js',
];

const queue = new Queue();

benchmarks.forEach(file => {
  queue.add(runner.bind({file: resolve(__dirname, 'routers', file)}));
});

function runner(done) {
  const child = fork(this.file);
  child.on('close', done);
}
