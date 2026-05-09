# Automated test inventory (`impl-01`)

Source of truth for behavior is [`CONTRIBUTING.md`](./CONTRIBUTING.md) (**FR‑002**, **FR‑004/005**, **FR‑007**, **SEC‑002**, UTF‑8 policy). Integration tests live under **`test/`**: Issue #11 coverage spawns **`node scripts/random-word.mjs`**; Issue #12 coverage spawns **`node scripts/chunk-count.mjs`**. **`npm test`** uses **`node --test`** so multiple `*.integration.test.mjs` files run in one command (do not drop the `--test` flag when adding suites).

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
| TEST-001 | All AC cases above via `node:test` + `spawnSync`. |
| TEST-003 (FR-006) | **Not automated** here (no stdin read-error simulation); manual: close pipe mid-read or inject EIO where supported; expect **non-zero** exit and **no** spurious success count on stdout. |

**Implementer deliverable:** add `scripts/chunk-count.mjs` so `npm test` passes; document the tool in **README** (NFR-005) with invocation, chunk rule, and UTF-8 mode. Extend `npm run build` / `scripts/build-verify.mjs` to `node --check` the new script if you keep that gate for every CLI.
