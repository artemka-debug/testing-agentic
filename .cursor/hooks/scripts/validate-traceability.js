#!/usr/bin/env node
/**
 * Preflight before PR: ensure every `must` requirement is covered or waived in coverage-matrix.md.
 * Usage: validate-traceability.js <requirements.json> <coverage-matrix.md>
 */
const fs = require('fs');

function fail(msg) {
  console.error(`validate-traceability: ${msg}`);
  process.exit(1);
}

const reqPath = process.argv[2] || process.env.AGENTIC_REQUIREMENTS_JSON;
const matrixPath = process.argv[3] || process.env.AGENTIC_COVERAGE_MATRIX;

if (!reqPath || !matrixPath) {
  fail('usage: validate-traceability.js <requirements.json> <coverage-matrix.md>');
}

let reqs;
try {
  const doc = JSON.parse(fs.readFileSync(reqPath, 'utf8'));
  reqs = Array.isArray(doc) ? doc : doc.requirements;
} catch {
  fail(`cannot parse requirements at ${reqPath}`);
}

if (!Array.isArray(reqs)) fail('requirements must be array or { requirements: [] }');

let matrixText = '';
try {
  matrixText = fs.readFileSync(matrixPath, 'utf8');
} catch {
  fail(`cannot read coverage matrix at ${matrixPath}`);
}

const mustIds = reqs.filter((r) => r.priority === 'must').map((r) => r.id);

mustIds.forEach((id) => {
  const re = new RegExp(`\\b${id}\\b[^\\n]*`, 'i');
  const line = matrixText.split(/\r?\n/).find((l) => re.test(l));
  if (!line) fail(`missing row mentioning ${id} in ${matrixPath}`);

  const lower = line.toLowerCase();
  const ok =
    /\bcovered\b/.test(lower) ||
    /\bwaived\b/.test(lower) ||
    /\bpass\b/.test(lower);
  if (!ok) {
    fail(`${id}: matrix line must indicate covered|waived|pass — got: ${line.trim()}`);
  }
});

console.log(`validate-traceability: OK (${mustIds.length} must requirements)`);
process.exit(0);
