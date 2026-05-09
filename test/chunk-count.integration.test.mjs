import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { DEFAULT_MAX_INPUT_BYTES } from "../scripts/constants.mjs";
import { stderrText, stdoutText } from "./helpers.mjs";

const CHUNK_COUNT_SCRIPT_PATH = fileURLToPath(
  new URL("../scripts/chunk-count.mjs", import.meta.url),
);

/**
 * @typedef {{ cwd?: string, env?: Record<string, string|undefined>, input?: Buffer | string, args?: string[] }} RunOpts
 */

/**
 * @param {RunOpts} [opts]
 * @returns {import("node:child_process").SpawnSyncReturnsWithString<Buffer>}
 */
function runChunkCount(opts = {}) {
  const args = opts.args ?? [];
  return spawnSync(process.execPath, [CHUNK_COUNT_SCRIPT_PATH, ...args], {
    input: opts.input,
    cwd: opts.cwd,
    env: { ...process.env, ...opts.env },
    maxBuffer: 16 * DEFAULT_MAX_INPUT_BYTES,
  });
}

test("implementer scaffold: scripts/chunk-count.mjs exists", () => {
  assert.ok(
    existsSync(CHUNK_COUNT_SCRIPT_PATH),
    `Add ${CHUNK_COUNT_SCRIPT_PATH} (see test-expectations.md Issue #12). Invocation: node scripts/chunk-count.mjs`,
  );
});

function refuteMissingEntrypoint(stderr) {
  assert.ok(
    !/cannot find module/i.test(stderr),
    "Node failed to locate scripts/chunk-count.mjs — add the CLI before asserting counting behavior.",
  );
}

/**
 * @param {import("node:child_process").SpawnSyncReturnsWithString<Buffer>} res
 * @param {number} expectedCount
 */
function assertStrictSuccessCount(res, expectedCount) {
  assert.ifError(res.error);
  refuteMissingEntrypoint(stderrText(res));
  assert.equal(res.status, 0, stderrText(res));
  assert.equal(stderrText(res).length, 0, "stderr must be silent on success (spec user-visible behavior)");
  const text = stdoutText(res);
  assert.match(
    text,
    /^[0-9]+\n$/u,
    `stdout must be decimal integer + single Unix newline; got ${JSON.stringify(text)}`,
  );
  assert.equal(Number(text.trimEnd(), 10), expectedCount);
}

test("AC-001: empty stdin prints 0", () => {
  const res = runChunkCount({ input: "" });
  assertStrictSuccessCount(res, 0);
});

test("AC-002: no newline prints 1", () => {
  const res = runChunkCount({ input: "a" });
  assertStrictSuccessCount(res, 1);
});

test("AC-003: trailing newline yields empty final chunk", () => {
  const res = runChunkCount({ input: "a\n" });
  assertStrictSuccessCount(res, 2);
});

test("AC-004: internal newline splits; no trailing newline → last chunk non-empty", () => {
  const res = runChunkCount({ input: "a\nb" });
  assertStrictSuccessCount(res, 2);
});

test("AC-005: single newline → two empty chunks", () => {
  const res = runChunkCount({ input: "\n" });
  assertStrictSuccessCount(res, 2);
});

test("AC-006: repeated x\\n segments (1000) → 1001 chunks", () => {
  const res = runChunkCount({ input: "x\n".repeat(1000) });
  assertStrictSuccessCount(res, 1001);
});

test("FR-004 edge: consecutive newlines yield empty chunks between", () => {
  const res = runChunkCount({ input: "\n\n" });
  assertStrictSuccessCount(res, 3);
});

test("AC-007: valid UTF-8 multibyte scalar counts like ASCII", () => {
  const res = runChunkCount({
    input: Buffer.from([0xe2, 0x82, 0xac, 0x0a]),
  });
  assertStrictSuccessCount(res, 2);
});

test("AC-007: streaming decode — newline split across small stdin reads still counts correctly", () => {
  const res = runChunkCount({
    env: { CHUNK_COUNT_READ_BYTES: "2" },
    input: Buffer.from([0xe2, 0x82, 0xac, 0x0a]),
  });
  assertStrictSuccessCount(res, 2);
});

test("SEC-002 parity: stdin over MAX_INPUT_BYTES exits non-zero without success-shaped stdout", () => {
  const res = runChunkCount({
    env: { MAX_INPUT_BYTES: "10" },
    input: "a".repeat(11),
  });
  refuteMissingEntrypoint(stderrText(res));
  assert.ifError(res.error);
  assert.notEqual(res.status, 0);
  assert.ok(/byte limit|SEC-002/u.test(stderrText(res)), stderrText(res));
  assert.ok(!/^[0-9]+\n$/u.test(stdoutText(res)), stdoutText(res));
});

test("SEC-002: MAX_INPUT_BYTES=0 is rejected (misconfiguration)", () => {
  const res = runChunkCount({
    env: { MAX_INPUT_BYTES: "0" },
    input: "",
  });
  refuteMissingEntrypoint(stderrText(res));
  assert.ifError(res.error);
  assert.notEqual(res.status, 0);
  assert.ok(/invalid max_input_bytes/i.test(stderrText(res)), stderrText(res));
});

test("AC-007: invalid UTF-8 byte fails in strict mode (non-zero, stderr, no success-shaped stdout)", () => {
  const res = runChunkCount({ input: Buffer.from([0xff]) });
  refuteMissingEntrypoint(stderrText(res));
  assert.ifError(res.error);
  assert.notEqual(res.status, 0);
  assert.ok(stderrText(res).trim().length > 0, "stderr should explain failure");
  const out = stdoutText(res);
  assert.ok(
    !/^[0-9]+\n$/u.test(out),
    `stdout must not print a lone decimal count line on UTF-8 failure; got ${JSON.stringify(out)}`,
  );
});

test("A-002: CR without LF is not a boundary; LF still splits (\\r remains in prior chunk)", () => {
  const res = runChunkCount({ input: "a\r\n" });
  assertStrictSuccessCount(res, 2);
});

test("CLI: --help with extra arguments is rejected with a clear message", () => {
  const res = runChunkCount({ args: ["--help", "foo"], input: "" });
  refuteMissingEntrypoint(stderrText(res));
  assert.ifError(res.error);
  assert.notEqual(res.status, 0);
  assert.ok(/additional arguments/u.test(stderrText(res)), stderrText(res));
});

test("CLI: -h with extra arguments is rejected with a clear message", () => {
  const res = runChunkCount({ args: ["-h", "x"], input: "" });
  refuteMissingEntrypoint(stderrText(res));
  assert.ifError(res.error);
  assert.notEqual(res.status, 0);
  assert.ok(/additional arguments/u.test(stderrText(res)), stderrText(res));
});
