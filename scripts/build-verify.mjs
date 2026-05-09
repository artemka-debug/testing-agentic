import { access } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(new URL("../scripts/random-word.mjs", import.meta.url));
const chunkCountPath = fileURLToPath(new URL("../scripts/chunk-count.mjs", import.meta.url));
const constantsPath = fileURLToPath(new URL("../scripts/constants.mjs", import.meta.url));

await access(scriptPath);
await access(chunkCountPath);
await access(constantsPath);

for (const path of [scriptPath, chunkCountPath, constantsPath]) {
  const check = spawnSync(process.execPath, ["--check", path], {
    encoding: "utf8",
  });

  if (check.status !== 0) {
    console.error(check.stderr || check.stdout);
    process.exit(check.status ?? 1);
  }
}
