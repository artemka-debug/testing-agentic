#!/usr/bin/env node
/**
 * Chunk count CLI (Issue #12). Reads one byte stream from stdin and prints how many
 * UTF-8 "chunks" it contains (line segments delimited by U+000A only).
 *
 * UTF-8: strict (fatal) decoding — invalid sequences exit non-zero with stderr.
 * See README and test-expectations.md for FR/NFR traceability.
 */

import { readSync, writeSync } from "node:fs";

import { DEFAULT_MAX_INPUT_BYTES } from "./constants.mjs";

function die(message) {
  try {
    writeSync(2, `${message}\n`);
  } catch {
    // Last-resort: stderr may be unusable (ignored).
  }
  process.exit(1);
}

function parseMaxInputBytes() {
  const raw = process.env.MAX_INPUT_BYTES;
  if (raw === undefined || raw === "") {
    return DEFAULT_MAX_INPUT_BYTES;
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) {
    die("Invalid MAX_INPUT_BYTES (must be a positive integer)");
  }
  return n;
}

/** Optional harness knob for streaming-boundary tests (deterministic across read sizes). */
function parseReadChunkBytes() {
  const raw = process.env.CHUNK_COUNT_READ_BYTES;
  if (raw === undefined || raw === "") {
    return 65_536;
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0 || n > 65_536) {
    die("Invalid CHUNK_COUNT_READ_BYTES (must be a positive integer ≤ 65536)");
  }
  return n;
}

function drainStdin() {
  const drainBufSize = 65_536;
  const buf = Buffer.allocUnsafe(drainBufSize);
  while (true) {
    let n;
    try {
      n = readSync(0, buf, 0, drainBufSize, undefined);
    } catch {
      break;
    }
    if (n === 0) {
      break;
    }
  }
}

function printHelp() {
  try {
    writeSync(
      1,
      `usage: node scripts/chunk-count.mjs [-h | --help]

Read standard input until EOF. Print one non-negative decimal integer line to stdout
(the chunk count), with a single trailing Unix newline (\\n). On success, stderr is empty.

Chunk rule (v1 / A-001): after strict UTF-8 decoding, split on newline (U+000A) only.
Each substring between boundaries is one chunk, including empty substrings.
Wholly empty stdin (no decoded Unicode scalar values) yields 0 chunks.
Carriage return (U+000D) is not a delimiter; it may appear inside a chunk (e.g. CRLF).

UTF-8 mode: strict (default). Invalid UTF-8 causes a non-zero exit and a message on stderr;
no success-shaped count is printed on stdout.

Stdin raw-byte budget defaults to 1 MiB (override MAX_INPUT_BYTES; SEC-002 parity with Issue #11).
`,
    );
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    die(`Failed to write to stdout: ${detail}`);
  }
}

/** @param {string[]} argv */
function parseArgv(argv) {
  if (argv.length === 0) {
    return "run";
  }

  const helpFlags = new Set(["-h", "--help"]);
  if (argv.some((a) => helpFlags.has(a))) {
    if (argv.length !== 1) {
      die("Help does not accept additional arguments");
    }
    return "help";
  }

  const unknownOpt = argv.find((a) => a.startsWith("-"));
  if (unknownOpt !== undefined) {
    die(`Unknown option: ${unknownOpt}`);
  }

  die(`Unexpected argument: ${argv[0]} (this tool reads stdin only)`);
}

/** @param {string} text @param {{ newlineCount: number, hasScalars: boolean }} state */
function tallyNewlines(text, state) {
  if (text.length === 0) {
    return;
  }
  // TextDecoder output aligns with Unicode scalar values for valid UTF-8 (FR-004 empty stdin rule).
  state.hasScalars = true;
  for (let i = 0; i < text.length; i += 1) {
    if (text.charCodeAt(i) === 0x0a) {
      state.newlineCount += 1;
    }
  }
}

function countChunksFromStdin() {
  const decoder = new TextDecoder("utf-8", { fatal: true });
  const state = { newlineCount: 0, hasScalars: false };
  const maxBytes = parseMaxInputBytes();
  const chunkSize = parseReadChunkBytes();
  const buf = Buffer.allocUnsafe(chunkSize);
  let totalRead = 0;

  while (true) {
    let n;
    try {
      n = readSync(0, buf, 0, chunkSize, undefined);
    } catch (err) {
      const code =
        err && typeof err === "object" && "code" in err
          ? String(/** @type {{ code: unknown }} */ (err).code)
          : "";
      const detail = err instanceof Error ? err.message : String(err);
      die(
        `Failed to read standard input${code ? ` (${code})` : ""}${detail && detail !== code ? `: ${detail}` : ""}`,
      );
    }
    if (n === 0) {
      break;
    }
    totalRead += n;
    if (totalRead > maxBytes) {
      drainStdin();
      die(
        `input exceeds ${maxBytes} byte limit (SEC-002); pipe less data or raise MAX_INPUT_BYTES`,
      );
    }
    let decoded;
    try {
      decoded = decoder.decode(buf.subarray(0, n), { stream: true });
    } catch {
      die("invalid UTF-8 on stdin");
    }
    tallyNewlines(decoded, state);
  }

  let tail;
  try {
    tail = decoder.decode();
  } catch {
    die("invalid UTF-8 on stdin");
  }
  tallyNewlines(tail, state);

  if (!state.hasScalars) {
    return 0;
  }
  return state.newlineCount + 1;
}

function main() {
  const mode = parseArgv(process.argv.slice(2));
  if (mode === "help") {
    printHelp();
    return;
  }

  const count = countChunksFromStdin();
  try {
    writeSync(1, `${count}\n`);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    die(`Failed to write to stdout: ${detail}`);
  }
}

main();
