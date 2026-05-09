#!/usr/bin/env node
/**
 * Random word CLI (Issue #11). Prints one word from WORDS_FILE to stdout.
 *
 * Randomness: default uses Math.random (non-cryptographic; not for secrets).
 * Optional: --seed or RANDOM_WORD_SEED (uint32) for deterministic index = seed % |words|.
 *
 * See CONTRIBUTING.md for stdin vs --input, limits, UTF-8, and TTY behavior.
 */

import { readFileSync, readSync } from "node:fs";
import tty from "node:tty";
import {
  DEFAULT_MAX_INPUT_BYTES,
  DEFAULT_MAX_WORDLIST_BYTES,
} from "./constants.mjs";

function die(message) {
  process.stderr.write(`${message}\n`);
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

function parseMaxWordlistBytes() {
  const raw = process.env.MAX_WORDLIST_BYTES;
  if (raw === undefined || raw === "") {
    return DEFAULT_MAX_WORDLIST_BYTES;
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) {
    die("Invalid MAX_WORDLIST_BYTES (must be a positive integer)");
  }
  return n;
}

/**
 * @param {string[]} argv
 * @returns {{ input: string | null, seed: string | null }}
 */
function parseArgv(argv) {
  /** @type {string | null} */
  let input = null;
  /** @type {string | null} */
  let seed = null;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--input") {
      const next = argv[i + 1];
      if (next === undefined) {
        die("Missing value for --input");
      }
      input = next;
      i += 1;
    } else if (arg.startsWith("--input=")) {
      input = arg.slice("--input=".length);
    } else if (arg === "--seed") {
      const next = argv[i + 1];
      if (next === undefined) {
        die("Missing value for --seed");
      }
      seed = next;
      i += 1;
    } else if (arg.startsWith("--seed=")) {
      seed = arg.slice("--seed=".length);
    } else if (arg === "--") {
      die("Unexpected positional arguments; use --input <text>");
    } else if (arg.startsWith("-")) {
      die(`Unknown option: ${arg}`);
    } else {
      die(`Unexpected argument: ${arg}`);
    }
  }

  return { input, seed };
}

/** @param {string} s */
function hasInvalidSurrogates(s) {
  for (let i = 0; i < s.length; i += 1) {
    const c = s.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff) {
      const low = i + 1 < s.length ? s.charCodeAt(i + 1) : -1;
      if (low < 0xdc00 || low > 0xdfff) {
        return true;
      }
      i += 1;
    } else if (c >= 0xdc00 && c <= 0xdfff) {
      return true;
    }
  }
  return false;
}

/** @param {string} s */
function assertValidUtf8StringFromArgv(s) {
  if (hasInvalidSurrogates(s)) {
    die("invalid Unicode in --input (unpaired surrogate)");
  }
  const len = Buffer.byteLength(s, "utf8");
  const max = parseMaxInputBytes();
  if (len > max) {
    die(
      `input exceeds ${max} byte limit (SEC-002); provide shorter --input or raise MAX_INPUT_BYTES`,
    );
  }
}

/** @param {Buffer} buf */
function decodeUtf8Strict(buf) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buf);
  } catch {
    return null;
  }
}

function drainStdin() {
  const chunkSize = 65_536;
  const buf = Buffer.allocUnsafe(chunkSize);
  while (true) {
    let n;
    try {
      n = readSync(0, buf, 0, chunkSize, undefined);
    } catch {
      // Best-effort drain after byte-limit overrun; readSync may fail if the
      // pipe closes early—stdin may remain partially unread for the parent.
      break;
    }
    if (n === 0) {
      break;
    }
  }
}

/** @param {number} maxBytes */
function readStdinRawCapped(maxBytes) {
  const chunkSize = 65_536;
  /** @type {Buffer[]} */
  const chunks = [];
  let total = 0;
  const buf = Buffer.allocUnsafe(chunkSize);

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
    total += n;
    if (total > maxBytes) {
      drainStdin();
      die(
        `input exceeds ${maxBytes} byte limit (SEC-002); pipe less data or raise MAX_INPUT_BYTES`,
      );
    }
    chunks.push(Buffer.from(buf.subarray(0, n)));
  }

  return Buffer.concat(chunks);
}

/** @param {string | null} argvInput */
function resolvePayload(argvInput) {
  if (argvInput !== null) {
    assertValidUtf8StringFromArgv(argvInput);
    return argvInput;
  }

  if (tty.isatty(0)) {
    die(
      "No input: provide --input <text> or pipe data on stdin (interactive stdin is not read; see FR-007).",
    );
  }

  const maxBytes = parseMaxInputBytes();
  const raw = readStdinRawCapped(maxBytes);
  const text = decodeUtf8Strict(raw);
  if (text === null) {
    die("invalid UTF-8 on stdin");
  }

  return text;
}

/** @param {string} text */
function normalizeAndTrim(text) {
  const withNl = text.replaceAll("\r\n", "\n").replaceAll("\r", "\n");
  return withNl.trim();
}

/** @param {string | null} seedArg --seed / --seed= value if present; `null` if no flag */
function resolveSeed(seedArg) {
  if (seedArg !== null) {
    if (seedArg === "") {
      die("Invalid seed: --seed requires a non-empty value (0 … 4294967295)");
    }
    return parseSeedNumeric(seedArg);
  }

  const raw = process.env.RANDOM_WORD_SEED ?? "";
  if (raw === "") {
    return null;
  }

  return parseSeedNumeric(raw);
}

/** @param {string} raw */
function parseSeedNumeric(raw) {
  if (!/^\d+$/.test(raw)) {
    die("Invalid seed: must be an unsigned 32-bit integer (0 … 4294967295)");
  }

  const n = Number(raw);
  if (n > 0xffff_ffff || !Number.isSafeInteger(n)) {
    die("Invalid seed: must be an unsigned 32-bit integer (0 … 4294967295)");
  }

  return n >>> 0;
}

const WORD_LINE = /^[a-z]+$/u;

function loadWords() {
  const path = process.env.WORDS_FILE;
  if (!path) {
    die("WORDS_FILE environment variable is required (path to newline-separated word list)");
  }

  let buf;
  try {
    buf = readFileSync(path);
  } catch {
    die(`Cannot read word list: ${path}`);
  }

  const maxWordlist = parseMaxWordlistBytes();
  if (buf.length > maxWordlist) {
    die(
      `word list exceeds ${maxWordlist} byte limit; use a smaller WORDS_FILE or raise MAX_WORDLIST_BYTES`,
    );
  }

  const contents = decodeUtf8Strict(buf);
  if (contents === null) {
    die("Word list is not valid UTF-8");
  }

  const words = contents
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);

  if (words.length === 0) {
    die("Word list is empty");
  }

  for (let i = 0; i < words.length; i += 1) {
    const w = words[i];
    if (!WORD_LINE.test(w)) {
      die(
        `Invalid word in word list at line ${i + 1}: each token must match /^[a-z]+$/ (got ${JSON.stringify(w)})`,
      );
    }
  }

  return words;
}

function main() {
  const { input: argvInput, seed: seedArg } = parseArgv(process.argv.slice(2));
  const payload = resolvePayload(argvInput);
  const trimmed = normalizeAndTrim(payload);

  if (trimmed === "") {
    die(
      "empty input after trim (FR-005): provide non-whitespace via --input or pipe data on stdin.",
    );
  }

  const seed = resolveSeed(seedArg);
  const words = loadWords();
  /** @type {number} */
  let index;
  if (seed === null) {
    index = Math.floor(Math.random() * words.length);
  } else {
    index = seed % words.length;
  }

  const word = words[index];
  process.stdout.write(`${word}\n`);
}

main();
