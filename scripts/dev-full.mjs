import { spawn } from 'node:child_process';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const children = [
  spawn(process.execPath, ['server/index.mjs'], { stdio: 'inherit', env: process.env }),
  spawn(npm, ['run', 'dev'], { stdio: 'inherit', env: process.env })
];

let shuttingDown = false;
const shutdown = (code = 0) => {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM');
  }
  setTimeout(() => process.exit(code), 250);
};

for (const child of children) child.on('exit', code => { if (!shuttingDown && code && code !== 0) shutdown(code); });
process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
