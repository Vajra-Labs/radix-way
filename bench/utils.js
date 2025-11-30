import chalk from 'chalk';

const operations = 1000000;

function now() {
  const ts = process.hrtime();
  return ts[0] * 1e3 + ts[1] / 1e6;
}

function getOpsSec(ms) {
  return Number(((operations * 1000) / ms).toFixed()).toLocaleString();
}

function print(name, time) {
  console.log(`  ${chalk.cyan(name)} ${chalk.yellow(getOpsSec(now() - time))} ${chalk.gray('ops/sec')}`);
}

function title(name) {
  console.log(`\n${chalk.green('='.repeat(name.length + 2))}\n ${chalk.bold.white(name)}\n${chalk.green('='.repeat(name.length + 2))}`);
}

function Queue() {
  this.q = [];
  this.running = false;
}

Queue.prototype.add = function add(job) {
  this.q.push(job);
  if (!this.running) this.run();
};

Queue.prototype.run = function run() {
  this.running = true;
  const job = this.q.shift();
  job(() => {
    if (this.q.length) {
      this.run();
    } else {
      this.running = false;
    }
  });
};

export {now, getOpsSec, print, title, Queue, operations};
