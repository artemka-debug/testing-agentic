# Automated test inventory (`impl-01`)

Source of truth for behavior is [`CONTRIBUTING.md`](./CONTRIBUTING.md) (**FR‑002**, **FR‑004/005**, **FR‑007**, **SEC‑002**, UTF‑8 policy). Integration tests live under **`test/`**: Issue #11 coverage spawns **`node scripts/random-word.mjs`**; Issue #12 coverage spawns **`node scripts/chunk-count.mjs`**, exercising the same scalar chunk function **C** as **`scripts/chunking-c.mjs`** (**TEST‑001** unit suite). **`npm test`** runs **`node --test`** across these files (**do not** drop **`--test`** when adding suites).

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

## Issue #12 — stdin → chunk count (**C** wired in CLI)

**Canonical invocation:** `node scripts/chunk-count.mjs` (see **`README.md`**; **runtime floor:** Node **20+** per `package.json` `engines`). The CLI applies **scalar chunk function C**: non-overlapping segments of at most **`W`** Unicode scalar values (**`DEFAULT_CHUNK_WIDTH`**, override **`--width` / `CHUNK_WIDTH`** — **FR‑013**), implemented in **`scripts/chunking-c.mjs`** and invoked through **`chunkUtf8Bytes`** on stdin or per‑file (**FR‑005**). **UTF‑8** is strict (**FR‑010**); oversize stdin and **Mode A** file bodies are rejected via **`MAX_INPUT_BYTES`** (**SEC‑002**, shared default with Issue #11).

### Modes (**FR‑002 / FR‑009**)

| Mode | Trigger | Meaning |
|---|---|---|
| **B** | (default) | Stdin raw bytes decode as **one document** → count **`chunkUtf8Bytes(stdin, W).length`** |
| **A** | **`--paths`** | Stdin UTF‑8 = newline path list (**FR‑003** empty lines skipped after stripping trailing **`\\r`**); **`--base-dir`** optional (**FR‑004**); stdout = **sum** of per‑file counts (**FR‑007**); strict errors (**FR‑011**). |

| Requirement | Automated coverage |
|---|---|
| FR‑001 stdin | **`readSync`** until EOF; Mode B aggregates full stdin buffer (within **`MAX_INPUT_BYTES`**). Mode A aggregates path list stdin. Optional **`CHUNK_COUNT_READ_BYTES`** only shrinks **`readSync`** slices. |
| FR‑005 / NFR‑003 | Counts match **`chunkUtf8Bytes`** (integration compares to **`segmentCount`** helper + **TEST‑001** unit tests). |
| FR‑006 | Success stdout `/^[0-9]+\\n$/`, stderr empty. |
| FR‑010 | Invalid stdin bytes (**Mode B**); invalid stdin path‑list Unicode (**Mode A**); invalid file body UTF‑8; stderr only, non‑zero. |
| FR‑013 | **`CHUNK_WIDTH`**, **`--width`**, **`--width=`** precedence (CLI overrides env); invalid widths rejected (**`CHUNK_WIDTH=0`**, malformed **`--width`**). |
| FR‑011 / AC‑003 | Missing path; directory placeholder; unreadable paths; **`--base-dir` without `--paths`**; **`--base-dir`** must be a directory; path **`..` escape** and symlink‑to‑outside with **`--base-dir`**; absolute path lines rejected when **`--base-dir`** is set; POSIX **EACCES** on listed files. |
| FR‑004 | Relative paths from cwd; **`--base-dir`** resolution under **realpath** containment rules. |
| FR‑009 | **`--paths` vs raw** dichotomy asserted; duplicate paths summed twice. |
| SEC‑002 | Oversize stdin; oversize **Mode A** file vs **`MAX_INPUT_BYTES`**; invalid **`MAX_INPUT_BYTES`** (including non‑integer values). |
| AC‑005 / FR‑012 | **`--help`** mentions **C**, scalar vs grapheme policy, **`W`**, stdin modes (B vs A · **`--paths`**), symlink note, **`MAX_INPUT_BYTES`**, **`CHUNK_WIDTH`**, exit codes (**strict** wording in script). |

**CLI UX:** **`--help` / `-h` alone exits `0`**; combined with other argv ⇒ stderr mentions additional arguments.

**Implementer checklist:** **`README.md`** mirrors **`--help`** on **SEC‑001/002**, **UTF‑8**, symlink following, **`C`**, **`W`**, stdin modes (**PR‑14** traceability keeps **Issue #11**‑style tooling layout under **`npm test`** / **`npm run build`**).
