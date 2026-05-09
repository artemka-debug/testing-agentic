# testing-agentic

Small CLI utilities and harness for Issue #11 (random word from a bundled word list).

## Prerequisites

- **Node.js** 20+ (`package.json` `engines`)
- A newline-separated word list; point **`WORDS_FILE`** at its path (relative paths resolve from the current working directory). Each non-empty line must be lowercase ASCII letters only (`[a-z]+`); see **`CONTRIBUTING.md`** for size limits (**`MAX_WORDLIST_BYTES`**).

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
