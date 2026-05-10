import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  DEFAULT_CHUNK_WIDTH,
  DEFAULT_MAX_INPUT_BYTES,
} from "../scripts/constants.mjs";
import { chunkUtf8Bytes } from "../scripts/chunking-c.mjs";
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

/**
 * @param {string | Buffer} input
 * @param {number} [W]
 */
function segmentCount(input, W = DEFAULT_CHUNK_WIDTH) {
  const buf = Buffer.isBuffer(input)
    ? Buffer.from(input)
    : Buffer.from(input, "utf8");
  return chunkUtf8Bytes(buf, W).length;
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

test("AC-001 / AC-004 Mode B: empty stdin prints 0 (C on empty decoded text)", () => {
  const res = runChunkCount({ input: "" });
  assertStrictSuccessCount(res, 0);
});

test("Mode B: non-empty ASCII shorter than default W → 1 chunk", () => {
  const res = runChunkCount({ input: "a" });
  assertStrictSuccessCount(res, segmentCount("a"));
});

test("Mode B: newlines affect scalar length, not newline-specific chunk rules", () => {
  assert.strictEqual(segmentCount("a\n"), 1);
  const res = runChunkCount({ input: "a\n" });
  assertStrictSuccessCount(res, segmentCount("a\n"));
});

test("Mode B: CLI count matches chunkUtf8Bytes(stdin).length (default W)", () => {
  const payload = "\n\n😀€";
  assertStrictSuccessCount(runChunkCount({ input: payload }), segmentCount(payload));
});

test("FR-005 / FR-013: --width trims segments — boundary W vs W+1", () => {
  assert.strictEqual(segmentCount("abcd", 4), 1);
  assert.strictEqual(segmentCount("abcde", 4), 2);
  assertStrictSuccessCount(
    runChunkCount({ input: "abcd", args: ["--width", "4"] }),
    1,
  );
  assertStrictSuccessCount(
    runChunkCount({ input: "abcde", args: ["--width", "4"] }),
    2,
  );
});

test("FR-013: CHUNK_WIDTH env default override", () => {
  const payload = "abcdef";
  const res = runChunkCount({
    env: { CHUNK_WIDTH: "4" },
    input: payload,
  });
  assertStrictSuccessCount(res, segmentCount(payload, 4));
});

test("FR-013: --width wins over CHUNK_WIDTH", () => {
  const payload = "abcdefghij";
  const res = runChunkCount({
    env: { CHUNK_WIDTH: "2" },
    args: ["--width", "10"],
    input: payload,
  });
  assertStrictSuccessCount(res, segmentCount(payload, 10));
});

test("AC-007: multi-byte UTF-8 on stdin counted as Unicode scalars", () => {
  const buf = Buffer.from([0xe2, 0x82, 0xac, 0x0a]); // euro + LF
  assertStrictSuccessCount(
    runChunkCount({ input: buf }),
    segmentCount(buf),
  );
});

test("Streaming assembly: small read slices preserve C count", () => {
  const buf = Buffer.from([0xe2, 0x82, 0xac, 0x0a]);
  const res = runChunkCount({
    env: { CHUNK_COUNT_READ_BYTES: "2" },
    input: buf,
  });
  assertStrictSuccessCount(res, segmentCount(buf));
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

test("FR-010: invalid UTF-8 byte fails in strict Mode B", () => {
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

test("FR-013: CHUNK_WIDTH=0 rejected", () => {
  const res = runChunkCount({
    env: { CHUNK_WIDTH: "0" },
    input: "a",
  });
  assert.notEqual(res.status, 0);
  assert.ok(/invalid chunk_width/i.test(stderrText(res)), stderrText(res));
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

test("AC-005: --help documents chunk function C and stdin modes", () => {
  const res = runChunkCount({ args: ["--help"], input: "" });
  assert.ifError(res.error);
  assert.equal(res.status, 0);
  const out = stdoutText(res);
  assert.match(out, /Chunk function \*\*C\*\*/u);
  assert.match(out, /scalar/u);
  assert.match(out, /--paths/u);
  assert.match(out, /Mode B/u);
});

test("FR-009 Mode A AC-002: sum chunk counts across files", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "chunk-count-a-"));
  const p1 = path.join(dir, "one.txt");
  const p2 = path.join(dir, "two.txt");
  writeFileSync(p1, "hello");
  writeFileSync(p2, "x");
  const stdin = `${p1}\n${p2}\n`;
  const expected = segmentCount("hello") + segmentCount("x");
  assertStrictSuccessCount(
    runChunkCount({ input: stdin, args: ["--paths"], cwd: dir }),
    expected,
  );
});

test("FR-003 / AC-004 Mode A: blank lines skipped → 0 when no paths", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "chunk-count-blank-"));
  const res = runChunkCount({
    input: "\n\n\n",
    args: ["--paths"],
    cwd: dir,
  });
  assertStrictSuccessCount(res, 0);
});

test("FR-004 Mode A: relative paths from cwd", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "chunk-count-rel-"));
  writeFileSync(path.join(dir, "f.txt"), "abc");
  assertStrictSuccessCount(
    runChunkCount({ input: "f.txt\n", args: ["--paths"], cwd: dir }),
    segmentCount("abc"),
  );
});

test("FR-004 Mode A: --base-dir resolves relative path lines", () => {
  const base = mkdtempSync(path.join(tmpdir(), "chunk-count-base-"));
  const sub = path.join(base, "d");
  mkdirSync(sub);
  writeFileSync(path.join(sub, "inner.txt"), "yy");
  const res = runChunkCount({
    cwd: tmpdir(),
    args: ["--paths", "--base-dir", sub],
    input: "inner.txt\n",
  });
  assertStrictSuccessCount(res, segmentCount("yy"));
});

test("AC-003 Mode A: missing file path fails run", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "chunk-count-miss-"));
  const res = runChunkCount({
    input: "does-not-exist.txt\n",
    args: ["--paths"],
    cwd: dir,
  });
  assert.notEqual(res.status, 0);
  assert.ok(stderrText(res).length > 0);
  assert.ok(!/^[0-9]+\n$/u.test(stdoutText(res)));
});

test("AC-003 Mode A: directory path fails run", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "chunk-count-dir-"));
  const subdir = path.join(dir, "emptydir");
  mkdirSync(subdir);
  const res = runChunkCount({
    input: `${subdir}\n`,
    args: ["--paths"],
    cwd: dir,
  });
  assert.notEqual(res.status, 0);
  assert.ok(/directory/u.test(stderrText(res)), stderrText(res));
});

test("Mode A: CRLF path line — trailing \\r stripped per FR-003", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "chunk-count-crlf-"));
  const f = path.join(dir, "g.txt");
  writeFileSync(f, "z");
  const line = `${f}\r`;
  const res = runChunkCount({
    input: `${line}\n`,
    args: ["--paths"],
    cwd: dir,
  });
  assertStrictSuccessCount(res, segmentCount("z"));
});

test("Mode A: duplicate paths count twice (documented)", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "chunk-count-dup-"));
  const f = path.join(dir, "t.txt");
  writeFileSync(f, "ab");
  const stdin = `${f}\n${f}\n`;
  assertStrictSuccessCount(
    runChunkCount({ input: stdin, args: ["--paths"], cwd: dir }),
    2 * segmentCount("ab"),
  );
});

test("FR-010 Mode A: invalid UTF-8 on stdin path list fails", () => {
  const res = runChunkCount({
    input: Buffer.from([0xff, 0x0a]),
    args: ["--paths"],
  });
  assert.notEqual(res.status, 0);
  assert.ok(/utf-8|invalid/i.test(stderrText(res)), stderrText(res));
});

test("FR-010 Mode A: invalid UTF-8 file contents fail", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "chunk-count-badutf-"));
  const f = path.join(dir, "bad.txt");
  writeFileSync(f, Buffer.from([0xff]));
  const res = runChunkCount({
    input: `${f}\n`,
    args: ["--paths"],
    cwd: dir,
  });
  assert.notEqual(res.status, 0);
  assert.ok(/utf-8/i.test(stderrText(res)), stderrText(res));
  assert.ok(!/^[0-9]+\n$/u.test(stdoutText(res)));
});

test("FR-011: --base-dir without --paths rejected", () => {
  const res = runChunkCount({
    args: ["--base-dir", "/tmp"],
    input: "a",
  });
  assert.notEqual(res.status, 0);
  assert.ok(/requires --paths/u.test(stderrText(res)), stderrText(res));
});

test("MAX_INPUT_BYTES fractional env value is rejected", () => {
  const res = runChunkCount({
    env: { MAX_INPUT_BYTES: "10.9" },
    input: "",
  });
  assert.notEqual(res.status, 0);
  assert.ok(/invalid max_input_bytes/i.test(stderrText(res)), stderrText(res));
});

test("SEC-002 Mode A: file larger than MAX_INPUT_BYTES fails", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "chunk-count-big-"));
  const f = path.join(dir, "big.txt");
  writeFileSync(f, "x".repeat(20));
  const res = runChunkCount({
    env: { MAX_INPUT_BYTES: "10" },
    input: `${f}\n`,
    args: ["--paths"],
    cwd: dir,
  });
  assert.notEqual(res.status, 0);
  assert.ok(/exceeds.*byte limit|max_input_bytes/i.test(stderrText(res)), stderrText(res));
  assert.ok(!/^[0-9]+\n$/u.test(stdoutText(res)));
});

test("Mode A: --base-dir must be a directory, not a file", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "chunk-count-bdf-"));
  const file = path.join(dir, "not-a-dir");
  writeFileSync(file, "x");
  const res = runChunkCount({
    args: ["--paths", "--base-dir", file],
    input: "x\n",
    cwd: dir,
  });
  assert.notEqual(res.status, 0);
  assert.ok(/not a directory|base-dir/i.test(stderrText(res)), stderrText(res));
});

test("SEC / Mode A: path lines must not escape --base-dir (..)", () => {
  const base = mkdtempSync(path.join(tmpdir(), "chunk-count-jail-"));
  const sub = path.join(base, "d");
  mkdirSync(sub);
  writeFileSync(path.join(base, "outside.txt"), "yy");
  const res = runChunkCount({
    cwd: tmpdir(),
    args: ["--paths", "--base-dir", sub],
    input: "../outside.txt\n",
  });
  assert.notEqual(res.status, 0);
  assert.ok(/escapes --base-dir/i.test(stderrText(res)), stderrText(res));
});

test("Mode A with --base-dir: absolute path lines are rejected", () => {
  const base = mkdtempSync(path.join(tmpdir(), "chunk-count-abs-"));
  const f = path.join(base, "f.txt");
  writeFileSync(f, "a");
  const res = runChunkCount({
    args: ["--paths", "--base-dir", base],
    input: `${f}\n`,
    cwd: tmpdir(),
  });
  assert.notEqual(res.status, 0);
  assert.ok(/absolute path.*--base-dir|--base-dir.*absolute/i.test(stderrText(res)), stderrText(res));
});

test(
  "Mode A with --base-dir: symlink target outside base is rejected",
  { skip: process.platform === "win32" },
  () => {
    const base = mkdtempSync(path.join(tmpdir(), "chunk-count-symout-"));
    const outside = path.join(tmpdir(), `chunk-out-${Date.now()}.txt`);
    writeFileSync(outside, "zz");
    symlinkSync(outside, path.join(base, "out"));

    const res = runChunkCount({
      args: ["--paths", "--base-dir", base],
      input: "out\n",
      cwd: tmpdir(),
    });
    assert.notEqual(res.status, 0);
    assert.ok(/escapes --base-dir/i.test(stderrText(res)), stderrText(res));
  },
);

test(
  "FR-011 Mode A: permission denied on file (EACCES)",
  { skip: process.platform === "win32" },
  () => {
    const dir = mkdtempSync(path.join(tmpdir(), "chunk-count-eacces-"));
    const f = path.join(dir, "secret.txt");
    writeFileSync(f, "no");
    chmodSync(f, 0o000);
    try {
      const res = runChunkCount({
        input: `${f}\n`,
        args: ["--paths"],
        cwd: dir,
      });
      assert.notEqual(res.status, 0);
      assert.ok(stderrText(res).length > 0);
      assert.ok(!/^[0-9]+\n$/u.test(stdoutText(res)));
    } finally {
      try {
        chmodSync(f, 0o644);
      } catch {
        // ignore
      }
    }
  },
);
