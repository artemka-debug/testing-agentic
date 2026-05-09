import assert from "node:assert/strict";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  DEFAULT_MAX_INPUT_BYTES,
  fixtureWords,
  runScript,
  SCRIPT_PATH,
  stderrText,
  stdoutText,
} from "./helpers.mjs";

const words = fixtureWords();

test("implementer scaffold: scripts/random-word.mjs exists", () => {
  assert.ok(
    existsSync(SCRIPT_PATH),
    `Create ${SCRIPT_PATH} before exercising detailed CLI expectations.`,
  );
});

function refuteMissingEntrypoint(stderr) {
  assert.ok(
    !/cannot find module/i.test(stderr),
    "Node failed to locate scripts/random-word.mjs — add the CLI file before asserting detailed behavior.",
  );
}

function assertWordLine(res) {
  const text = stdoutText(res);
  assert.match(text, /^[a-z]+\n$/u, `stdout must be one lowercase word + newline, got ${JSON.stringify(text)}`);
  const word = text.trimEnd();
  assert.ok(words.includes(word), `stdout word must come from fixture vocabulary, got ${word}`);
}

function assertHealthySpawn(res) {
  assert.ifError(res.error);
  refuteMissingEntrypoint(stderrText(res));
}

test("success: --input accepts user text and prints one fixture word", () => {
  const res = runScript(["--input", "  hello world  "]);
  assertHealthySpawn(res);
  assert.equal(res.status, 0, stderrText(res));
  assertWordLine(res);
  assert.equal(stderrText(res).length, 0);
});

test("success: piped stdin is read when no --input", () => {
  const res = runScript([], { input: "pipeline\n" });
  assertHealthySpawn(res);
  assert.equal(res.status, 0, stderrText(res));
  assertWordLine(res);
});

test("FR-002: --input wins; stdin is not consulted when --input present", () => {
  const garbage = Buffer.from([0xff, 0xfe, 0xfd]);
  const res = runScript(["--input", "ok"], { input: garbage });
  assertHealthySpawn(res);
  assert.equal(res.status, 0, stderrText(res));
  assertWordLine(res);
});

test("FR-004/FR-005: whitespace-only --input is empty after trim → failure", () => {
  const res = runScript(["--input", " \t\r\n "]);
  refuteMissingEntrypoint(stderrText(res));
  assert.ifError(res.error);
  assert.notEqual(res.status, 0);
  assert.ok(stderrText(res).trim().length > 0, "stderr should explain empty input");
});

test("FR-007: piped stdin closed immediately (no bytes) without args → failure, no hang", () => {
  const res = runScript([], { input: "" });
  refuteMissingEntrypoint(stderrText(res));
  assert.ifError(res.error);
  assert.notEqual(res.status, 0);
  assert.ok(stderrText(res).trim().length > 0, "stderr should mention missing input");
});

test("SEC-002: oversized piped stdin is rejected before decoding", () => {
  const blob = `${"z".repeat(DEFAULT_MAX_INPUT_BYTES)}\n`;
  assert.ok(Buffer.byteLength(blob, "utf8") > DEFAULT_MAX_INPUT_BYTES);
  const res = runScript([], { input: blob });
  refuteMissingEntrypoint(stderrText(res));
  assert.ifError(res.error);
  assert.notEqual(res.status, 0);
  const err = stderrText(res).toLowerCase();
  assert.ok(
    err.includes("1048576") || err.includes("limit") || err.includes("large"),
    `stderr should mention limit, got ${JSON.stringify(err)}`,
  );
});

test("stdin invalid UTF-8 is rejected without --input", () => {
  const res = runScript([], { input: Buffer.from([0xff]) });
  refuteMissingEntrypoint(stderrText(res));
  assert.ifError(res.error);
  assert.notEqual(res.status, 0);
  const err = stderrText(res).toLowerCase();
  assert.ok(
    err.includes("utf") || err.includes("encoding"),
    `stderr should mention UTF-8, got ${JSON.stringify(err)}`,
  );
});

test("FR-008/TEST-002: deterministic selection uses seed modulo vocabulary length (fixture order)", () => {
  for (let i = 0; i < 9; i += 1) {
    const res = runScript(["--seed", String(i), "--input", "x"]);
    assertHealthySpawn(res);
    assert.equal(res.status, 0, stderrText(res));
    const word = stdoutText(res).trimEnd();
    const expected = words[i % words.length];
    assert.equal(word, expected, `seed ${i}`);
  }
});

test("FR-008: numeric seeds must be unsigned 32-bit integers", () => {
  const below = runScript(["--seed", "-1", "--input", "x"]);
  refuteMissingEntrypoint(stderrText(below));
  assert.ifError(below.error);
  assert.notEqual(below.status, 0);

  const above = runScript(["--seed", "4294967296", "--input", "x"]);
  refuteMissingEntrypoint(stderrText(above));
  assert.ifError(above.error);
  assert.notEqual(above.status, 0);
});

test("FR-008: invalid seed rejects with script-level error messaging", () => {
  const res = runScript(["--seed", "not-a-number", "--input", "x"]);
  refuteMissingEntrypoint(stderrText(res));
  assert.ifError(res.error);
  assert.notEqual(res.status, 0);
  const err = stderrText(res).trim();
  assert.ok(err.length > 0);
});

test("FR-008/TEST-002: RANDOM_WORD_SEED env behaves like --seed when flag absent", () => {
  const res = runScript(["--input", "x"], {
    env: { RANDOM_WORD_SEED: "1" },
  });
  assertHealthySpawn(res);
  assert.equal(res.status, 0, stderrText(res));
  assert.equal(stdoutText(res).trimEnd(), words[1 % words.length]);
});

test("SEC-002: MAX_INPUT_BYTES=0 is rejected (misconfiguration)", () => {
  const res = runScript(["--input", "x"], { env: { MAX_INPUT_BYTES: "0" } });
  refuteMissingEntrypoint(stderrText(res));
  assert.ifError(res.error);
  assert.notEqual(res.status, 0);
  assert.ok(
    stderrText(res).toLowerCase().includes("max_input_bytes"),
    stderrText(res),
  );
});

test("FR-008: empty --seed value is rejected", () => {
  const res = runScript(["--seed", "", "--input", "x"]);
  refuteMissingEntrypoint(stderrText(res));
  assert.ifError(res.error);
  assert.notEqual(res.status, 0);
});

test("FR-008: empty --seed= form is rejected", () => {
  const res = runScript(["--seed=", "--input", "x"]);
  refuteMissingEntrypoint(stderrText(res));
  assert.ifError(res.error);
  assert.notEqual(res.status, 0);
});

test("NFR-002: word list lines must match /^[a-z]+$/", () => {
  const dir = mkdtempSync(join(tmpdir(), "random-word-test-"));
  try {
    const badList = join(dir, "bad.txt");
    writeFileSync(badList, "alfa\nBravo\ncharlie\n", "utf8");
    const res = runScript(["--input", "x"], { env: { WORDS_FILE: badList } });
    refuteMissingEntrypoint(stderrText(res));
    assert.ifError(res.error);
    assert.notEqual(res.status, 0);
    assert.ok(
      /word list|invalid word|\[a-z\]/i.test(stderrText(res)),
      stderrText(res),
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("word list file larger than MAX_WORDLIST_BYTES is rejected", () => {
  const dir = mkdtempSync(join(tmpdir(), "random-word-test-"));
  try {
    const huge = join(dir, "huge.txt");
    const cap = 48;
    writeFileSync(huge, `${"a".repeat(cap + 1)}\n`, "utf8");
    const res = runScript(["--input", "x"], {
      env: { WORDS_FILE: huge, MAX_WORDLIST_BYTES: String(cap) },
    });
    refuteMissingEntrypoint(stderrText(res));
    assert.ifError(res.error);
    assert.notEqual(res.status, 0);
    const err = stderrText(res).toLowerCase();
    assert.ok(
      err.includes("word list") && err.includes("limit"),
      stderrText(res),
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
