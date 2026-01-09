import {Queue} from './utils.js';
import {fileURLToPath} from 'url';
import {fork} from 'child_process';
import {resolve, dirname} from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const benchmarks = [
  'rou3.js',
  'radix-tree.js',
  'find-my-way.js',
  'rou3-compiled.js',
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
