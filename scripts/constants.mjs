/** Shared limits for CLIs (`random-word.mjs`, `chunk-count.mjs`) and tests. */

/** Default cap for stdin raw bytes / `--input` UTF-8 bytes (`random-word`) and stdin-only reads (`chunk-count`). SEC-002. */
export const DEFAULT_MAX_INPUT_BYTES = 1_048_576;

/**
 * Default maximum Unicode scalar values per segment for chunk function **C** (`chunk-count.mjs`).
 * Override with `--width` or `CHUNK_WIDTH` (**FR‑013**).
 */
export const DEFAULT_CHUNK_WIDTH = 80;

/**
 * Default cap for `WORDS_FILE` size on disk (bytes). Mitigates accidental/huge reads
 * (availability). Override via `MAX_WORDLIST_BYTES` (positive integer).
 */
export const DEFAULT_MAX_WORDLIST_BYTES = 262_144;
