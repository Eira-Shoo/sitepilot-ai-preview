/**
 * Production-mode local server — stable styling, no HMR.
 * Use when dev keeps breaking: npm run dev:stable
 */
import { spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = process.env.PORT ?? "3001";

function run(cmd, args, inherit = false) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: root,
      stdio: inherit ? "inherit" : "pipe",
      shell: process.platform === "win32",
      env: process.env,
    });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
    child.on("error", reject);
  });
}

async function main() {
  const nextDir = join(root, ".next");
  if (existsSync(nextDir)) {
    console.log("[dev:stable] Clearing .next");
    rmSync(nextDir, { recursive: true, force: true });
  }

  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  console.log("[dev:stable] Building…");
  await run(npm, ["run", "build"]);

  console.log(`[dev:stable] Starting production server → http://localhost:${port}`);
  const nextBin = join(root, "node_modules", "next", "dist", "bin", "next");
  const child = spawn(process.execPath, [nextBin, "start", "-p", port], {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, PORT: port },
  });

  child.on("exit", (code) => process.exit(code ?? 0));
}

main().catch((err) => {
  console.error("[dev:stable] Failed:", err);
  process.exit(1);
});
