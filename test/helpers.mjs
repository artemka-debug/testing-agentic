import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { DEFAULT_MAX_INPUT_BYTES } from "../scripts/constants.mjs";

export const SCRIPT_PATH = fileURLToPath(
  new URL("../scripts/random-word.mjs", import.meta.url),
);

export const FIXTURE_WORDS_PATH = fileURLToPath(
  new URL("./fixtures/wordlist-for-tests.txt", import.meta.url),
);

export { DEFAULT_MAX_INPUT_BYTES };

/** @typedef {{ cwd?: string, env?: Record<string, string|undefined>, input?: Buffer | string }} RunOpts */

export function fixtureWords() {
  return readFileSync(FIXTURE_WORDS_PATH, "utf8")
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);
}

/** @param {{ stdout?: Buffer, stderr?: Buffer }} res */
export function stderrText(res) {
  const chunk = res.stderr ?? Buffer.alloc(0);
  return chunk.toString("utf8");
}

/** @param {{ stdout?: Buffer }} res */
export function stdoutText(res) {
  const chunk = res.stdout ?? Buffer.alloc(0);
  return chunk.toString("utf8");
}

/**
 * Spawn the CLI with tests’ fixture vocabulary unless WORDS_FILE is overridden via `env`.
 * @param {string[]} args
 * @param {RunOpts} [opts]
 */
export function runScript(args = [], opts = {}) {
  const env = {
    ...process.env,
    ...opts.env,
  };
  if (!Object.hasOwn(opts.env ?? {}, "WORDS_FILE")) {
    env.WORDS_FILE = FIXTURE_WORDS_PATH;
  }

  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
    input: opts.input,
    cwd: opts.cwd,
    env,
    maxBuffer: 16 * DEFAULT_MAX_INPUT_BYTES,
  });
}
