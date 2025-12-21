import chalk from 'chalk';

export const operations = 1_000_000;

export function now() {
  const ts = process.hrtime();
  return ts[0] * 1e3 + ts[1] / 1e6;
}

export function getOpsSec(ms) {
  return Number(((operations * 1000) / ms).toFixed()).toLocaleString();
}

export function print(name, time) {
  console.log(chalk.yellow(name), getOpsSec(now() - time), 'ops/sec');
}

export function title(name) {
  console.log(
    chalk.green(`
${'='.repeat(name.length + 2)}
 ${name}
${'='.repeat(name.length + 2)}`),
  );
}

export class Queue {
  q = [];
  running = false;

  add(job) {
    this.q.push(job);
    if (!this.running) this.run();
  }

  run() {
    this.running = true;
    const job = this.q.shift();

    if (!job) {
      this.running = false;
      return;
    }

    job(() => {
      if (this.q.length) {
        this.run();
      } else {
        this.running = false;
      }
    });
  }
}
