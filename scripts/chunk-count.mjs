#!/usr/bin/env node
/**
 * Chunk count CLI (Issue #12 / PR #14). Applies deterministic chunk function **C** from
 * `chunking-c.mjs`: non-overlapping UTF‑8 text segments with at most **W** Unicode
 * scalar values per segment (see `--help`; not grapheme-cluster aware).
 *
 * Stdin modes (**FR‑009**): default **Mode B** — stdin is one document’s raw bytes.
 * With **`--paths`**, **Mode A** — stdin is a UTF‑8 newline‑delimited list of file paths.
 */

import {
  readFileSync,
  readSync,
  realpathSync,
  statSync,
  writeSync,
} from "node:fs";
import path from "node:path";

import {
  DEFAULT_CHUNK_WIDTH,
  DEFAULT_MAX_INPUT_BYTES,
} from "./constants.mjs";
import { chunkUtf8Bytes } from "./chunking-c.mjs";

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
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) {
    die("Invalid MAX_INPUT_BYTES (must be a positive integer)");
  }
  const n = Number(trimmed);
  if (n <= 0) {
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
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) {
    die("Invalid CHUNK_COUNT_READ_BYTES (must be a positive integer ≤ 65536)");
  }
  const n = Number(trimmed);
  if (n <= 0 || n > 65_536) {
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

/**
 * @param {number | undefined} cliWidth
 * @returns {number}
 */
function resolveW(cliWidth) {
  if (cliWidth !== undefined) {
    return cliWidth;
  }
  const raw = process.env.CHUNK_WIDTH;
  if (raw === undefined || raw === "") {
    return DEFAULT_CHUNK_WIDTH;
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) {
    die("Invalid CHUNK_WIDTH (must be a positive integer)");
  }
  return n;
}

function printHelp() {
  try {
    writeSync(
      1,
      `usage: node scripts/chunk-count.mjs [-h | --help]
       node scripts/chunk-count.mjs [--paths] [--width N] [--base-dir DIR]

Read standard input until EOF. On success, print one non-negative decimal integer and
a single trailing Unix newline (\\n) to stdout; stderr is empty.

Chunk function **C** (**FR-005**): after strict UTF-8 validation, split text into
non-overlapping segments, each holding at most **W** Unicode **scalar values** (code
points). This is **not** grapheme-cluster segmentation — combining marks are separate
scalars. Empty decoded content yields **0** chunks; any non-empty content yields **≥ 1**
chunk even when the scalar count is less than **W**.

**W** defaults to ${DEFAULT_CHUNK_WIDTH}. Override with **--width N** or **CHUNK_WIDTH**
(positive integer; invalid values → stderr message, exit 1).

**Stdin modes** (**FR-002 / FR-009**):
  • Default (**Mode B**): stdin bytes are **one logical document**. Count is
    segments C applied to stdin after fatal UTF‑8 decode.
  • **--paths** (**Mode A**): stdin must be UTF‑8 text whose lines are file paths (one
    per line). A final line without a trailing newline is a valid path row. Rows that
    are empty after stripping a trailing carriage return (**\\r**) are skipped
    (**FR-003**). Non-empty UTF‑8 decode errors fail the run (**FR-010**). Each listed
    file is read independently; stdout count is the **sum** of per-file segment counts
    (**FR-007**).

**Paths** (**Mode A**, **FR-004**): relative paths resolve from the process current
working directory unless **--base-dir DIR** is set (requires **--paths**); then each
path line must be **relative** (no leading slash / drive‑absolute segments) and is
resolved under the **real** base directory. **path..** segments and **symlink targets**
that leave the base directory are rejected (**SEC / containment**). Without
**--base-dir**, absolute path lines behave like normal **path.resolve(cwd, line)**.
**--base-dir** must refer to an existing **directory**. Duplicate paths count multiple times.

**Errors** (**FR-011** default strict): unreadable paths, expected files that are
directories, or I/O/stat failures terminate with exit 1 and a short stderr line
(no file body echoes, **SEC-004**).

**Symlinks**: followed like normal **readFile**/open (**SEC‑002**, OS default).

**Limits**: raw stdin bytes and **each regular file body** in **Mode A** are capped by
**MAX_INPUT_BYTES** (default matches Issue #11 / ${DEFAULT_MAX_INPUT_BYTES}); exceeding
either limit exits non-zero (**SEC-002**, message on stderr). Optional test harness knob
**CHUNK_COUNT_READ_BYTES** (≤ 65536) only changes internal stdin read slice size — not semantics.

Exit codes: **0** success; **non-zero** on misuse, UTF‑8 failures, I/O limits, or
misconfiguration (**FR‑010**, **FR‑011**, **SEC‑002**).

UTF-8: strict (**fatal**) for document bytes and (**Mode A**) path list text; invalid
sequences produce non-zero exit and stderr; no success-shaped count on stdout.
`,
    );
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    die(`Failed to write to stdout: ${detail}`);
  }
}

/**
 * @typedef {{ modeHelp: boolean, modePaths: boolean, width?: number, baseDir?: string }} ParsedArgv
 */

/** @param {string[]} argv @returns {ParsedArgv} */
function parseArgv(argv) {
  /** @type {ParsedArgv} */
  const out = {
    modeHelp: false,
    modePaths: false,
  };

  if (argv.length === 0) {
    return out;
  }

  const helpFlags = new Set(["-h", "--help"]);
  const helpTok = argv.find((a) => helpFlags.has(a));
  if (helpTok !== undefined) {
    if (argv.length !== 1) {
      die("Help does not accept additional arguments");
    }
    out.modeHelp = true;
    return out;
  }

  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--paths") {
      out.modePaths = true;
      continue;
    }
    if (a === "--base-dir") {
      const v = argv[i + 1];
      if (v === undefined || v.startsWith("-")) {
        die("--base-dir requires a directory argument");
      }
      out.baseDir = v;
      i += 1;
      continue;
    }
    if (a === "--width") {
      const v = argv[i + 1];
      if (v === undefined) {
        die("--width requires a positive integer argument");
      }
      const n = Number.parseInt(v, 10);
      if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) {
        die("Invalid --width (must be a positive integer)");
      }
      out.width = n;
      i += 1;
      continue;
    }
    if (a.startsWith("--width=")) {
      const raw = a.slice("--width=".length);
      const n = Number.parseInt(raw, 10);
      if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) {
        die("Invalid --width (must be a positive integer)");
      }
      out.width = n;
      continue;
    }
    if (a.startsWith("-")) {
      die(`Unknown option: ${a}`);
    }
    die(`Unexpected argument: ${a} (see --help)`);
  }

  if (out.baseDir !== undefined && !out.modePaths) {
    die("--base-dir requires --paths");
  }

  return out;
}

/**
 * Assemble full stdin into one buffer, enforcing **MAX_INPUT_BYTES**.
 * @param {number} maxBytes
 * @returns {Buffer}
 */
function readStdinToBuffer(maxBytes) {
  const chunkSize = parseReadChunkBytes();
  const buf = Buffer.allocUnsafe(chunkSize);
  /** @type {Buffer[]} */
  const parts = [];
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
    parts.push(Buffer.from(buf.subarray(0, n)));
  }

  return parts.length === 0 ? Buffer.alloc(0) : Buffer.concat(parts);
}

/**
 * Strict UTF‑8 segmentation count; exits on decode failure (**FR‑010**).
 * @param {Buffer} bytes
 * @param {number} W
 * @param {string} errLabel stderr context
 */
function trySegmentCount(bytes, W, errLabel) {
  try {
    return chunkUtf8Bytes(bytes, W).length;
  } catch (err) {
    // Strict UTF-8 decode uses **TypeError**; rethrow unexpected failures from **C**.
    if (err instanceof TypeError) {
      die(errLabel);
    }
    throw err;
  }
}

/**
 * @param {string} baseReal
 * @param {string} absolutePath
 */
function assertPathStaysUnderBase(baseReal, absolutePath) {
  const rel = path.relative(baseReal, absolutePath);
  if (rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel))) {
    return;
  }
  die(`path escapes --base-dir: ${absolutePath}`);
}

/**
 * @param {string | undefined} baseDir
 * @returns {string | undefined}
 */
function resolveModeABaseReal(baseDir) {
  if (baseDir === undefined) {
    return undefined;
  }
  const br = path.resolve(baseDir);
  /** @type {import("node:fs").Stats} */
  let st;
  try {
    st = statSync(br);
  } catch (err) {
    die(fsErrorMessage(br, err));
  }
  if (!st.isDirectory()) {
    die(`--base-dir is not a directory: ${br}`);
  }
  try {
    return realpathSync(br);
  } catch (err) {
    die(fsErrorMessage(br, err));
  }
}

/**
 * @param {Buffer} bytes
 * @param {number} W
 * @returns {number}
 */
function countDocumentChunks(bytes, W) {
  return trySegmentCount(bytes, W, "invalid UTF-8 on stdin");
}

/**
 * @param {Buffer} stdinBytes
 * @param {number} W
 * @param {string | undefined} baseReal
 * @param {number} maxFileBytes
 * @returns {number}
 */
function countChunksModeA(stdinBytes, W, baseReal, maxFileBytes) {
  const decoder = new TextDecoder("utf-8", { fatal: true });
  /** @type {string} */
  let pathListText;
  try {
    pathListText = decoder.decode(stdinBytes);
  } catch {
    die("invalid UTF-8 on stdin (--paths mode expects UTF-8 path lines)");
  }

  let total = 0;
  const lines = pathListText.split("\n");
  const cwd = process.cwd();

  for (let line of lines) {
    if (line.endsWith("\r")) {
      line = line.slice(0, -1);
    }
    if (line === "") {
      continue;
    }

    /** @type {string} */
    let fullPath;
    if (baseReal !== undefined) {
      if (path.isAbsolute(line)) {
        die(
          "absolute path lines are not allowed with --base-dir (use paths relative to the base directory)",
        );
      }
      fullPath = path.resolve(baseReal, line);
      assertPathStaysUnderBase(baseReal, fullPath);
    } else {
      fullPath = path.resolve(cwd, line);
    }

    /** @type {import("node:fs").Stats} */
    let st;
    try {
      st = statSync(fullPath);
    } catch (err) {
      die(fsErrorMessage(fullPath, err));
    }

    if (st.isDirectory()) {
      die(`path is a directory (file expected): ${fullPath}`);
    }

    if (st.size > maxFileBytes) {
      die(
        `file exceeds ${maxFileBytes} byte limit (MAX_INPUT_BYTES); shorten file or raise MAX_INPUT_BYTES`,
      );
    }

    if (baseReal !== undefined) {
      let realTarget;
      try {
        realTarget = realpathSync(fullPath);
      } catch (err) {
        die(fsErrorMessage(fullPath, err));
      }
      assertPathStaysUnderBase(baseReal, realTarget);
    }

    /** @type {Buffer} */
    let fileBytes;
    try {
      fileBytes = readFileSync(fullPath);
    } catch (err) {
      die(fsErrorMessage(fullPath, err));
    }

    total += trySegmentCount(
      fileBytes,
      W,
      `invalid UTF-8 in file: ${fullPath}`,
    );
  }

  return total;
}

/** @param {string} fullPath @param {unknown} err */
function fsErrorMessage(fullPath, err) {
  const e = /** @type {NodeJS.ErrnoException} */ (err);
  const code =
    typeof e.code === "string" && e.code.length > 0 ? ` (${e.code})` : "";
  return `cannot read path: ${fullPath}${code}`;
}

function main() {
  const parsed = parseArgv(process.argv.slice(2));
  if (parsed.modeHelp) {
    printHelp();
    return;
  }

  const W = resolveW(parsed.width);
  const maxBytes = parseMaxInputBytes();
  const stdinBuf = readStdinToBuffer(maxBytes);
  const baseReal = resolveModeABaseReal(parsed.baseDir);

  const count = parsed.modePaths
    ? countChunksModeA(stdinBuf, W, baseReal, maxBytes)
    : countDocumentChunks(stdinBuf, W);

  try {
    writeSync(1, `${count}\n`);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    die(`Failed to write to stdout: ${detail}`);
  }
}

main();
