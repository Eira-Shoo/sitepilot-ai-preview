/**
 * Run: node scripts/test-import-parser.mjs
 * Requires: npx tsx (devDependency or npx download)
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cmd = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(
  cmd,
  ["tsx", join(root, "scripts/test-import-parser-runner.ts")],
  { cwd: root, stdio: "inherit", shell: true },
);

process.exit(result.status ?? 1);
