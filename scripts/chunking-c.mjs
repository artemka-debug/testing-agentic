/**
 * Pure chunking function **C** (FR-005 / NFR-003 / TEST-001).
 *
 * **Policy:** segments are measured in **Unicode scalar values** (code points), not
 * grapheme clusters. Surrogate halves do not appear in values produced from strict UTF-8
 * decode; callers using `chunkByMaxScalars` on arbitrary JS strings should pass
 * well‑formed Unicode text.
 *
 * @see test/chunking-c.unit.test.mjs
 */

/**
 * @param {unknown} W
 * @returns {asserts W is number}
 */
function assertPositiveIntegerW(W) {
  if (typeof W !== "number" || !Number.isInteger(W) || W <= 0) {
    throw new RangeError("W must be a positive integer");
  }
}

/**
 * Split decoded text into non-overlapping segments of at most **W** scalars each
 * (last segment may be shorter). Empty text yields **zero** segments; any non-empty
 * text yields **at least one** segment even when the scalar count is less than **W**.
 *
 * @param {string} text
 * @param {number} W
 * @returns {readonly string[]}
 */
export function chunkByMaxScalars(text, W) {
  assertPositiveIntegerW(W);
  if (text === "") {
    return [];
  }

  /** @type {string[]} */
  const segments = [];
  /** @type {string[]} */
  let buf = [];

  // `for…of` over a string yields Unicode scalar values (code points).
  for (const cp of text) {
    if (buf.length === W) {
      segments.push(buf.join(""));
      buf = [cp];
    } else {
      buf.push(cp);
    }
  }

  segments.push(buf.join(""));
  return segments;
}

/**
 * Strict UTF-8 decode (fail-fast) then {@link chunkByMaxScalars}.
 *
 * @param {Buffer | Uint8Array} bytes
 * @param {number} W
 * @returns {readonly string[]}
 */
export function chunkUtf8Bytes(bytes, W) {
  assertPositiveIntegerW(W);
  const decoder = new TextDecoder("utf-8", { fatal: true });
  const text = decoder.decode(bytes);
  return chunkByMaxScalars(text, W);
}
