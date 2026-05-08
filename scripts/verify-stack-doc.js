/**
 * Lightweight build gate: ensures stack documentation and compose file exist
 * and declare the locked Postgres major version until the Nest build is wired.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const required = [
  ['docs/STACK.md', /postgres\b.*\b16\b/i],
  ['compose.yaml', /postgres:16-alpine/],
];

let failed = false;
for (const [rel, pattern] of required) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) {
    console.error(`Missing required file: ${rel}`);
    failed = true;
    continue;
  }
  const text = fs.readFileSync(full, 'utf8');
  if (!pattern.test(text)) {
    console.error(`${rel} must mention locked Postgres 16 stack (pattern ${pattern}).`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log('Stack documentation and compose manifest verified.');
