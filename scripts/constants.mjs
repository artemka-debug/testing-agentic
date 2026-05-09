/** Shared limits for `random-word.mjs` and tests (single source of truth). */

/** Default cap for user payload (`stdin` raw bytes or `--input` UTF-8 bytes). SEC-002. */
export const DEFAULT_MAX_INPUT_BYTES = 1_048_576;

/**
 * Default cap for `WORDS_FILE` size on disk (bytes). Mitigates accidental/huge reads
 * (availability). Override via `MAX_WORDLIST_BYTES` (positive integer).
 */
export const DEFAULT_MAX_WORDLIST_BYTES = 262_144;
