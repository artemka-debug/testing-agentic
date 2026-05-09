# testing-agentic

Small CLI utilities and harness: Issue #11 (random word) and Issue #12 (stdin → UTF-8 chunk count).

## Prerequisites

- **Node.js** 20+ (`package.json` `engines`)
- A newline-separated word list; point **`WORDS_FILE`** at its path (relative paths resolve from the current working directory). Each non-empty line must be lowercase ASCII letters only (`[a-z]+`); see **`CONTRIBUTING.md`** for size limits (**`MAX_WORDLIST_BYTES`**).

## Chunk count script (Issue #12)

**Entry point:** **`node scripts/chunk-count.mjs`**

**Runtime:** Node.js **20+** (see `package.json` `engines`).

Reads **all bytes from stdin** until EOF (no required file path arguments). On success, **stdout** is **exactly one** decimal integer (ASCII digits only) plus a **single** `\n`; **stderr** is empty. Raw stdin size is capped by **`MAX_INPUT_BYTES`** (default **1 MiB**, same as Issue #11 / **`DEFAULT_MAX_INPUT_BYTES`** in `scripts/constants.mjs`) counting bytes **before** UTF-8 decoding; exceeding the limit exits non-zero with a stderr message (**SEC-002**).

**Chunk definition (v1):** after **strict UTF-8** decoding, split on **`\n` (U+000A) only**. Each substring between boundaries is one chunk, **including** empty segments. **Wholly empty stdin** ⇒ chunk count **`0`**. A **non-empty** stream with **no** `\n` ⇒ **`1`**. A **trailing** `\n` adds a final **empty** chunk (so `printf 'a\n'` ⇒ **`2`**). A bare carriage return (`\r`) is **not** a line terminator; it stays inside the prior chunk (e.g. `a\r\n` ⇒ two chunks: `a\r` and empty after the LF).

**UTF-8:** default is **strict** — invalid bytes ⇒ non-zero exit, message on stderr, and **no** lone count line on stdout. Use **`node scripts/chunk-count.mjs --help`** for a short usage summary.

### Examples (chunk count)

```bash
printf '' | node scripts/chunk-count.mjs
# stdout: 0\n

printf 'a' | node scripts/chunk-count.mjs
# stdout: 1\n

printf 'a\n' | node scripts/chunk-count.mjs
# stdout: 2\n
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

### Windows

Use the same `node` invocation; set env vars with `set WORDS_FILE=...` (cmd) or `$env:WORDS_FILE="..."` (PowerShell) before `node scripts/random-word.mjs …`.
