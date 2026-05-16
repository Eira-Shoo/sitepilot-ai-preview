/**
 * Reliable local dev: kill stale servers, wipe .next (incl. mixed prod/dev cache), start fresh.
 * npm run dev  → always uses this script
 */
import { spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = process.env.PORT ?? "3001";
const ports = ["3000", "3001", "3002", "3003", "3004"];

function run(cmd, args) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: "ignore", shell: true });
    child.on("exit", () => resolve());
    child.on("error", () => resolve());
  });
}

async function killPort(p) {
  if (process.platform === "win32") {
    await run("powershell", [
      "-NoProfile",
      "-Command",
      `$conns = Get-NetTCPConnection -LocalPort ${p} -ErrorAction SilentlyContinue; ` +
        `if ($conns) { $conns | Select-Object -ExpandProperty OwningProcess -Unique | ` +
        `ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } }`,
    ]);
    return;
  }
  await run("sh", ["-c", `lsof -ti:${p} | xargs kill -9 2>/dev/null || true`]);
}

function wipeNextCache() {
  const nextDir = join(root, ".next");
  if (!existsSync(nextDir)) return;
  console.log("[dev] Removing .next (avoids broken CSS after npm run build)");
  rmSync(nextDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
}

async function main() {
  console.log("[dev] Stopping stale servers on ports", ports.join(", "));
  for (const p of ports) await killPort(p);
  await delay(1500);

  wipeNextCache();

  console.log(`[dev] Starting Next.js → http://localhost:${port}`);
  console.log("[dev] Keep this terminal open. Do NOT run npm run build in another window.\n");

  const nextBin = join(root, "node_modules", "next", "dist", "bin", "next");
  const child = spawn(process.execPath, [nextBin, "dev", "-p", port], {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, PORT: port },
  });

  child.on("exit", (code) => process.exit(code ?? 0));
}

main().catch((err) => {
  console.error("[dev] Failed:", err);
  process.exit(1);
});
