# Automated test inventory (`impl-01`)

Source of truth for behavior is [`CONTRIBUTING.md`](./CONTRIBUTING.md) (**FR‑002**, **FR‑004/005**, **FR‑007**, **SEC‑002**, UTF‑8 policy). Integration tests live under **`test/`** and invoke **`node scripts/random-word.mjs`**.

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
