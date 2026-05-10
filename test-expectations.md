# Automated test inventory (`impl-01`)

Source of truth for behavior is [`CONTRIBUTING.md`](./CONTRIBUTING.md) (**FR‑002**, **FR‑004/005**, **FR‑007**, **SEC‑002**, UTF‑8 policy). Integration tests live under **`test/`**: Issue #11 coverage spawns **`node scripts/random-word.mjs`**; Issue #12 coverage spawns **`node scripts/chunk-count.mjs`**, augmented by **`test/chunking-c.unit.test.mjs`** for **`scripts/chunking-c.mjs`** (scalar chunking **C**, **TEST‑001**). **`npm test`** runs **`node --test`** across these files (**do not** drop **`--test`** when adding suites).

## Traceability


| Requirement | Automated coverage |
|---|---|
| FR‑003 / AC‑002 | Success stdout = one **`[a-z]+`** token plus `\n`; `--seed 0` must echo fixture word at index **`seed % n`** (fixture row order `alfa`,`bravo`,`charlie`). |
| FR‑002 | `--input` path; stdin pipe path; `--input` overrides stdin (invalid UTF‑8 on stdin still succeeds). |
| FR‑004 / FR‑005 | Leading/trailing spaces trimmed for emptiness; pure whitespace ⇒ non‑zero. |
| FR‑007 | Empty piped stdin with no args ⇒ non‑zero (no hang). |
| SEC‑002 | Stdin overrun; **`--input` MUST share the identical byte budget**; **`MAX_INPUT_BYTES`** must be a **positive** integer (**`0` rejected**). |
| UTF‑8 edge | Invalid UTF‑8 bytes on stdin ⇒ non‑zero stderr mention. |
| FR‑008 / TEST‑002 | Same **`--seed`** ⇒ identical stdout across invocations; **`RANDOM_WORD_SEED`** when **`--seed` absent**; empty **`--seed` / `--seed=`** ⇒ failure. |
| TEST‑003 | Invalid **`--seed`**, oversize stdin, empty input, empty **`--seed`**, invalid vocabulary line, word list over **`MAX_WORDLIST_BYTES`**. |
| NFR‑002 | Vocabulary lines must match **`/^[a-z]+$/`**; word list bytes capped (**`MAX_WORDLIST_BYTES`**, default 256 KiB). |
| build | `npm run build` runs `node --check` on the script (syntax gate). |

## Manual / follow-up

- **TTY without `--input`**: difficult to assert in CI; contract documented in `CONTRIBUTING.md` (must error, not block).
- **Stochastic spread (AC‑005)**: optional future property test; current coverage exercises deterministic `--seed` path.

---

## Issue #12 — stdin → chunk count (`impl` / `repo-01`)

**Canonical invocation:** `node scripts/chunk-count.mjs` (same `node scripts/…mjs` convention as Issue #11; **runtime floor:** Node **20+** per `package.json` `engines`). **Chunk (A-001):** after strict UTF-8 decode, split on **U+000A only**; empty stdin → **0** chunks; trailing `\n` yields a final **empty** segment. **Default UTF-8:** strict (invalid bytes → non-zero exit, stderr message, no success-shaped stdout). **TEST-002 / A-003:** CRLF normalization is **out of scope**; no tests assert `\r` stripping—only that **`a\r\n` → 2** chunks (`a\r` then empty), locking A-002.

| Requirement | Automated coverage |
|---|---|
| FR-001 / FR-007 | Subprocess with **stdin pipe only** (no argv paths required for counts). |
| FR-002 / AC-007 | Valid UTF-8 multibyte on stdin; strict mode rejects invalid byte `0xFF`. |
| FR-004 / FR-005 / AC-001–AC-006 | Empty → `0`; `a` → `1`; `a\n` → `2`; `a\nb` → `2`; `\n` → `2`; `\n\n` → `3`; `x\n` ×1000 → `1001`; success stdout = `/^[0-9]+\n$/`, stderr empty. |
| FR-004 / NFR-002 | Streaming `TextDecoder`: **`CHUNK_COUNT_READ_BYTES`** (test harness only, optional) shrinks `readSync` chunks to assert newline counting across buffer boundaries. |
| SEC-002 | Oversize stdin vs **`MAX_INPUT_BYTES`** (aligned with Issue #11 wording); invalid **`MAX_INPUT_BYTES`** (e.g. **`0`**) rejected. |
| A-002 | `a\r\n` → `2` chunks (only `\n` is a boundary). |
| CLI UX | `--help` / `-h` alone exits `0`; combined with other argv ⇒ stderr mentions additional arguments (not “unknown option”). |
| TEST-001 (**scalar C — PR‑14**) | **`test/chunking-c.unit.test.mjs`** + **`scripts/chunking-c.mjs`**: segments of maximum width **W** Unicode **scalar values** (code-point iteration such as `for…of`; **not** grapheme-cluster–aware — document explicitly in **`--help`**). Empty decoded content ⇒ **0** chunks; any non-empty content ⇒ **at least one** chunk even when scalar count is strictly below **W**. **`chunkUtf8Bytes`** wraps strict UTF‑8 (**FR‑010**, fatal `TextDecoder`): invalid bytes fail before chunking. **`W`** must be a positive integer (`RangeError` otherwise). The shipped stub throws from **`chunkByMaxScalars`** until **C** is implemented (expect **`npm test` failures** until then). This is intentionally **orthogonal** to the newline-split integration cases in **`chunk-count.integration.test.mjs`** until **`chunk-count.mjs`** is rewired to call **C**. |
| TEST-001 (newline integration alias) | The subprocess AC rows above exercise **newline** chunking (**A‑001**), **not** fixed-width scalar **W** (see **`chunking-c` unit file**). |
| TEST-003 (FR-006) | **Not automated** here (no stdin read-error simulation); manual: close pipe mid-read or inject EIO where supported; expect **non-zero** exit and **no** spurious success count on stdout. |

**Implementer deliverable:** keep **`scripts/chunk-count.mjs`** behavior aligned with **`chunk-count.integration.test.mjs`** until the CLI adopts **scalar C**. Implement **`chunkByMaxScalars`** in **`scripts/chunking-c.mjs`** so **`test/chunking-c.unit.test.mjs`** passes (**TEST‑001**). Document **`C`**, **`W`** defaults/fences, grapheme-vs-scalar policy, and UTF‑8 mode in **README/**`--help` (NFR‑005). **`npm run build`** already runs **`node --check`** on **`scripts/chunking-c.mjs`** alongside other CLIs.
