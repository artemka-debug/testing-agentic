/**
 * TEST-001: unit tests for chunking function **C** — non-overlapping UTF-8 text segments
 * with maximum width **W** Unicode scalar values (see `scripts/chunking-c.mjs` policy note
 * vs grapheme clusters).
 *
 * These tests target the pure API; wiring into `scripts/chunk-count.mjs` is a separate step.
 */

import assert from "node:assert/strict";
import { test } from "node:test";

import { chunkByMaxScalars, chunkUtf8Bytes } from "../scripts/chunking-c.mjs";

/** @param {readonly string[]} segments */
function totalScalarsAcrossSegments(segments) {
  let total = 0;
  for (const seg of segments) {
    total += [...seg].length;
  }
  return total;
}

test("C: empty text → 0 chunks (no segments)", () => {
  assert.deepEqual(chunkByMaxScalars("", 80), []);
});

test("C: ASCII shorter than W → exactly 1 chunk", () => {
  assert.deepEqual(chunkByMaxScalars("a", 10), ["a"]);
  assert.deepEqual(chunkByMaxScalars("hello", 100), ["hello"]);
});

test("C: multi-byte UTF-8 (Euro sign) each scalar counts as one; W=1 splits per scalar", () => {
  const text = "€€€";
  assert.deepEqual(chunkByMaxScalars(text, 1), ["€", "€", "€"]);
  assert.deepEqual(chunkByMaxScalars(text, 2), ["€€", "€"]);
  assert.deepEqual(chunkByMaxScalars(text, 4), ["€€€"]);
});

test("C: astral scalar (emoji) is one code point — not split by UTF-16 length", () => {
  const text = "😀😀";
  assert.equal(text.length, 4, "JS UTF-16 length must not drive chunk boundaries");
  assert.deepEqual(chunkByMaxScalars(text, 1), ["😀", "😀"]);
  assert.deepEqual(chunkByMaxScalars(text, 2), ["😀😀"]);
});

test("C: long homogeneous ASCII run splits into fixed ceiling count", () => {
  const text = "x".repeat(1000);
  const W = 100;
  const segments = chunkByMaxScalars(text, W);
  assert.equal(segments.length, 10);
  assert.ok(segments.every((s) => s.length <= W));
  assert.equal(totalScalarsAcrossSegments(segments), 1000);
  assert.deepEqual(segments, Array.from({ length: 10 }, () => "x".repeat(100)));
});

test("C: boundary at W → 1 chunk; at W+1 → 2 chunks", () => {
  const W = 4;
  assert.deepEqual(chunkByMaxScalars("abcd", W), ["abcd"]);
  assert.deepEqual(chunkByMaxScalars("abcde", W), ["abcd", "e"]);
});

test("C: exactly fills N chunks without remainder", () => {
  assert.deepEqual(chunkByMaxScalars("a".repeat(8), 4), ["aaaa", "aaaa"]);
});

test("C: combining mark is its own scalar — may sit in its own segment (not grapheme-aware)", () => {
  const text = "e\u0301";
  assert.deepEqual(chunkByMaxScalars(text, 1), ["e", "\u0301"]);
});

test("C: surrogate-pair handling is driven by scalar iteration for normal strings", () => {
  assert.deepEqual(chunkByMaxScalars("\u{1F600}", 1), ["\u{1F600}"]);
});

test("C: chunkUtf8Bytes mirrors chunkByMaxScalars for valid UTF-8", () => {
  assert.deepEqual(chunkUtf8Bytes(Buffer.from("abc", "utf8"), 2), ["ab", "c"]);
});

test("C: invalid UTF-8 fails fast when validating as text (FR-010)", () => {
  assert.throws(
    () => chunkUtf8Bytes(Buffer.from([0xff]), 4),
    TypeError,
    "strict UTF-8 decode must throw before chunking",
  );
});

test("C: invalid UTF-8 with trailing valid bytes still fails", () => {
  assert.throws(() => chunkUtf8Bytes(Buffer.from([0xc0, 0x80, 0x61]), 4), TypeError);
});

test("C: W must be a positive integer (0 rejected)", () => {
  assert.throws(() => chunkByMaxScalars("a", 0), RangeError);
  assert.throws(() => chunkUtf8Bytes(Buffer.from("a"), 0), RangeError);
});

test("C: W must be an integer (non-integer rejected)", () => {
  assert.throws(() => chunkByMaxScalars("a", 3.5), RangeError);
});

test("C: deterministic — same inputs yield identical segment arrays", () => {
  const text = "αβγδε";
  const W = 2;
  const a = chunkByMaxScalars(text, W);
  const b = chunkByMaxScalars(text, W);
  assert.deepEqual(a, b);
});
