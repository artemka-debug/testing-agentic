#!/usr/bin/env node
/**
 * Validates requirements.json per docs/plan.md §4.3 — REQ IDs, priority, acceptanceCriteria[], source.
 * Usage: validate-requirements.js <path/to/requirements.json>
 */
const fs = require('fs');
const path = process.argv[2] || process.env.AGENTIC_REQUIREMENTS_JSON || '';

function fail(msg) {
  console.error(`validate-requirements: ${msg}`);
  process.exit(1);
}

function warn(msg) {
  console.warn(`validate-requirements: warning: ${msg}`);
}

if (!path) fail('pass requirements.json path or set AGENTIC_REQUIREMENTS_JSON');

let raw;
try {
  raw = fs.readFileSync(path, 'utf8');
} catch {
  fail(`cannot read ${path}`);
}

let doc;
try {
  doc = JSON.parse(raw);
} catch {
  fail('invalid JSON');
}

const reqs = Array.isArray(doc) ? doc : doc.requirements;
if (!Array.isArray(reqs) || reqs.length === 0) {
  fail('expected JSON array or { requirements: [...] } with at least one item');
}

const idRe = /^REQ-[0-9]{3,}$/;
const priorities = new Set(['must', 'should', 'could']);

reqs.forEach((r, i) => {
  const prefix = `requirements[${i}]`;
  if (!r || typeof r !== 'object') fail(`${prefix}: must be object`);
  if (!r.id || typeof r.id !== 'string') fail(`${prefix}: missing id`);
  if (!idRe.test(r.id)) warn(`${r.id}: id format expected REQ-NNN+`);

  if (!r.title || typeof r.title !== 'string') fail(`${prefix}.${r.id}: missing title`);
  if (!r.description || typeof r.description !== 'string') warn(`${r.id}: description missing`);
  if (!r.source || typeof r.source !== 'string') fail(`${prefix}.${r.id}: missing source`);
  if (!priorities.has(r.priority)) fail(`${prefix}.${r.id}: priority must be must|should|could`);

  if (!Array.isArray(r.acceptanceCriteria) || r.acceptanceCriteria.length === 0) {
    fail(`${prefix}.${r.id}: acceptanceCriteria must be non-empty array`);
  }

  const methods = r.verificationMethods;
  if (methods !== undefined) {
    if (!Array.isArray(methods) || methods.length === 0) {
      fail(`${prefix}.${r.id}: verificationMethods must be non-empty array when present`);
    }
  }

  if (r.status !== undefined) {
    const ok = ['pending', 'covered', 'failed', 'waived'].includes(r.status);
    if (!ok) fail(`${prefix}.${r.id}: invalid status`);
  }
});

console.log(`validate-requirements: OK (${reqs.length} requirements)`);
process.exit(0);
