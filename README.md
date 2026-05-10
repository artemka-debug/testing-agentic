# testing-agentic

Small CLI utilities and harness: Issue #11 (random word) and Issue #12 (stdin → UTF-8 chunk count).

## Prerequisites

- **Node.js** 20+ (`package.json` `engines`)
- A newline-separated word list; point **`WORDS_FILE`** at its path (relative paths resolve from the current working directory). Each non-empty line must be lowercase ASCII letters only (`[a-z]+`); see **`CONTRIBUTING.md`** for size limits (**`MAX_WORDLIST_BYTES`**).

## Chunk count script (Issue #12 / PR #14)

**Typical file-list use:** pipe **one path per line** on stdin and pass **`--paths`** (Mode A). **Default stdin** without **`--paths`** treats the stream as **one UTF-8 document** (Mode B).

**Entry point:** **`node scripts/chunk-count.mjs`**

**Runtime:** Node.js **20+** (see `package.json` `engines`). Tested routinely on **macOS** and **Linux**; other platforms Node supports may work but are not explicitly CI‑verified here.

**Windows:** use the same `node` invocation; set env vars with `set VAR=...` (cmd) or `$env:VAR="..."` (PowerShell).

On success, **stdout** is **exactly one** non-negative decimal integer (ASCII digits only) plus a **single** `\n`; **stderr** is empty (**FR-006**).

### Chunk function **C** (**FR-005**)

Input is interpreted as **UTF-8 text** (strict / fail-fast: invalid bytes → non-zero exit and a short **stderr** message, no success-shaped count — **FR-010**).

**C** splits the decoded stream into **non-overlapping segments**, each containing at most **W** **Unicode scalar values** (code points). This is **not** grapheme-cluster segmentation: combining marks count as their own scalars. **Empty** decoded content ⇒ **`0` chunks**; **any non-empty** content ⇒ **at least one** chunk, even when total scalars &lt; **W**.

**W** defaults to **`80`** (**`DEFAULT_CHUNK_WIDTH`** in `scripts/constants.mjs`). Override with **`--width N`** or **`CHUNK_WIDTH`** (positive integer; invalid values ⇒ exit `1` — **FR-013**).

### Stdin modes (**FR-002 / FR-009**)

- **Mode B (default):** stdin bytes are **one logical document**. The printed count is **`chunkUtf8Bytes(stdin, W).length`** (same algorithm as `scripts/chunking-c.mjs`).
- **`--paths` (Mode A):** stdin must be **UTF-8 text** with **one file path per line** (final line may omit a trailing newline). After stripping a trailing **`\r`** on each line, **empty lines are skipped**. Each file is read independently; the tool prints the **sum** of per-file counts (**FR-007**). **Duplicate paths** are processed twice. Per-file bytes are capped by the same **`MAX_INPUT_BYTES`** budget as stdin (**SEC‑002**). **SEC-001:** path list is caller-controlled (only read what you list); do not pass untrusted paths without sandboxing.

**Path resolution (**FR-004**):** relative path lines resolve against the process **current working directory**, unless **`--base-dir DIR`** is passed (requires **`--paths`**). With **`--base-dir`**, each line must be a **relative** path; resolution uses the **real** directory, rejects **`..` escapes** and symlink targets that leave that directory, and rejects absolute path lines. **`--base-dir`** must be an existing **directory**. Without **`--base-dir`**, absolute path lines work as usual via **`path.resolve(cwd, line)`**. **`--base-dir` without `--paths` is an error.**

**Failures (**FR-011** default strict):** missing paths, permission errors, unreadable paths, or a **directory where a regular file was expected** → exit `1` and **stderr**; no count on stdout. Error lines avoid echoing file **contents** (**SEC-004**).

**Symlinks** are **followed** like ordinary `open`/`readFile` (**SEC-002**, OS-default semantics).

Raw stdin bytes are capped by **`MAX_INPUT_BYTES`** (default **1 MiB**, same **`DEFAULT_MAX_INPUT_BYTES`** as Issue #11 — **SEC-002**). In **Mode A**, each listed file’s size must also be **≤ `MAX_INPUT_BYTES`**. Optional harness-only **`CHUNK_COUNT_READ_BYTES` (≤ 65536)** only changes internal read granularity for stdin, not semantics.

Use **`node scripts/chunk-count.mjs --help`** for the full **`--help`** contract (**FR-012**) including exit codes.

### Examples (chunk count, Mode B)

```bash
printf '' | node scripts/chunk-count.mjs
# stdout: 0\n

printf 'hello' | node scripts/chunk-count.mjs
# stdout: 1\n   # one segment — shorter than default W

printf '%s' '😀€' | node scripts/chunk-count.mjs --width 1
# stdout: 2\n   # two scalars → two segments when W=1
```

### Example (**Mode A**)

```bash
printf '%s\n' ./a.txt ./b.txt | node scripts/chunk-count.mjs --paths
# cwd must resolve paths; stdout = sum of C counts over both files
```

## Random word script

Entry point: **`node scripts/random-word.mjs`**

On success, **stdout** is **exactly one** word from `WORDS_FILE`, drawn as plain text, plus a **single** newline (`\n`). The word is **not** derived from your input string unless you use **`--seed`** / **`RANDOM_WORD_SEED`** (then index is `seed % n` in file line order). See **`CONTRIBUTING.md`** for stdin vs `--input`, size limits, UTF-8, and TTY (non-hang) rules.

### Examples (input → random word)

Arg input — **stdout** is one token from `WORDS_FILE` (here: `alfa`, `bravo`, or `charlie`) plus `\n`; without `--seed` the choice varies per run:

```bash
WORDS_FILE=test/fixtures/wordlist-for-tests.txt node scripts/random-word.mjs --input "hello"
# stdout: <one of alfa, bravo, charlie>\n
```

Piped stdin — same shape:

```bash
echo hello | WORDS_FILE=test/fixtures/wordlist-for-tests.txt node scripts/random-word.mjs
# stdout: <one of alfa, bravo, charlie>\n
```

Reproducible output for demos/tests (fixture vocabulary `alfa` / `bravo` / `charlie` in order):

```bash
WORDS_FILE=test/fixtures/wordlist-for-tests.txt node scripts/random-word.mjs --seed 1 --input "x"
# stdout: bravo\n
```

## Development

```bash
npm test
npm run build
```

### Windows (random word env vars)

Use **`set WORDS_FILE=...`** (cmd) or **`$env:WORDS_FILE="..."`** (PowerShell) before **`node scripts/random-word.mjs`** invocations.
