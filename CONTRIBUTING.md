# Contributing

## Repository contents

The repo ships small **Node.js 20+** CLIs under **`scripts/`** (Issue #11 **`random-word.mjs`**, Issue #12 **`chunk-count.mjs`** / **`chunking-c.mjs`**) plus **`npm test`** / **`npm run build`** harnesses. Keep script paths stable or update references under **`test/`** and **`scripts/build-verify.mjs`**.

## Random word script — CLI / input contract (`impl-01`)

The executable entrypoint is **`scripts/random-word.mjs`** (invoked via `node scripts/random-word.mjs …`). Automated tests spawn this script; keep the filename stable or update paths in `test/`.

These decisions fix open items from the Issue #11 spec so later work does not reinterpret behavior.

### Input resolution (**FR-002**)

Precedence is strict:

1. If **`--input <string>`** is present anywhere on the argv list, **only** that string is used after decoding (combine with trimming below). Stdin **must not be read**.
2. Otherwise, if **fd 0** is **not** a TTY (`!tty.isatty(0)` — pipe, redirection, subprocess pipe), **read stdin until EOF** (binary cap below). Prefer **`tty.isatty(0)`** over **`process.stdin.isTTY`** before **`fs.readSync(0, …)`**: named imports from **`node:process`** can put stdin in a state where synchronous fd 0 reads fail with **`EAGAIN`** under **`child_process.spawnSync`** pipes.
3. Otherwise (interactive TTY and no `--input`), **fail fast** with a clear stderr message (non‑zero exit). **Do not** block waiting for user typing (**FR‑007**, CI‑safe).

Positional **`-- <text>`** is not required unless you explicitly add support; callers should use **`--input`**.

### Trimming (**FR‑004**) and emptiness (**FR‑005**)

- Before any “empty input” logic, normalize line endings (`\r\n` → `\n`) and **`trim()`** outer Unicode whitespace from the gathered string (`String.prototype.trim`).
- If the result is **empty**, exit **non‑zero**, write a clear message to **stderr** (recommended text: mentions “empty”, “provide `--input` or pipe…”).

Internal whitespace is untouched once the bounded byte buffer is decoded (see UTF‑8 below).

### Max input bytes (**SEC‑002**)

- **`MAX_INPUT_BYTES` default is `1048576` (1 MiB)** (see `scripts/constants.mjs`) counting raw bytes read from stdin **before** decoding, **or** the UTF‑8 byte length of the `--input` string once present in process memory. Many shells cannot pass multi‑megabyte argv strings; automated tests cover **stdin** overrun only, but the implementation must still enforce the same budget for `--input`.
- The variable must be a **positive integer**; **`0` is rejected** with a clear stderr message (misconfiguration should not masquerade as empty input).
- Overrun exits **non‑zero** with stderr explaining the limit. No partial truncation for MVP.

### Word list file (**NFR‑002** / availability)

- The file at **`WORDS_FILE`** is read as raw bytes, then decoded as **strict UTF‑8** (invalid bytes ⇒ non‑zero exit).
- Total file size must not exceed **`MAX_WORDLIST_BYTES`**, default **`262144` (256 KiB)** — override with a **positive integer** env var if needed. Mitigates accidental or hostile huge reads.
- After decoding, each non‑empty line is **trimmed**; every token must match **`/^[a-z]+$/`** (lowercase ASCII letters only). Otherwise the CLI exits **non‑zero** with a line‑numbered error (terminal‑safe output contract).

### No hang / unattended runs (**FR‑007**)

- Piped stdin that closes immediately yields **EOF** with **zero bytes** → treated like empty trimmed input ⇒ **failure** unless `--input` supplied.
- TTY stdin without `--input` ⇒ **immediate failure**, never waits for keystrokes.

### UTF‑8 and binary stdin

- Interpret stdin and `--input` as **UTF‑8**.
- **`--input`**: Node has already decoded argv into UTF‑16 strings; the script rejects **unpaired UTF‑16 surrogates** (invalid Unicode scalar values). The error text refers to **Unicode**, not raw UTF‑8 byte sequences, which do not surface as distinct `--input` arguments in normal shells.
- For **stdin**, on invalid UTF‑8 **`exit non‑zero`** and stderr **`invalid UTF-8`** / similar (replacement characters are **not** allowed silently for MVP).

### Randomness (**FR‑006 / FR‑008 / AC‑005 / SEC‑003**)

- Default: **`Math.random`** (document in script header—not for secrets, **SEC‑003**).
- Optional reproducible mode: **`--seed <integer>`** in range **`0 … 4294967295`** (reject otherwise with stderr **non‑zero**). An explicit **`--seed` / `--seed=`** with an **empty value** is **invalid** (do not treat as “no seed”). Mapping must remain deterministic; tests expect indexing **`seed % words.length`** over the **`WORDS_FILE` line order**.
- **`RANDOM_WORD_SEED` environment variable behaves as `--seed`** when **`--seed` is absent**. **`--seed` wins** over the env var when both are set.

### Output (**FR‑003 / AC‑002**)

- Exactly **one ASCII word**: token from **`WORDS_FILE`**, newline `\n`.
- Runtime enforcement: each vocabulary line (after trim) must be **`[a-z]+`**; the in-repo fixture satisfies this.
- **`WORDS_FILE`** path to newline‑separated vocabulary; relative paths resolve from cwd; tests set it to **`test/fixtures/wordlist-for-tests.txt`**.

### Combining stdin and args recap

Only `--input` and non‑TTY stdin are sources; **`--input` wins** and skips stdin reads.
