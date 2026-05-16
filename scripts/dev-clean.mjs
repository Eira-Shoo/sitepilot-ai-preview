/**
 * One-command local dev: stop stale Next servers, clear .next, start fresh.
 * Use: npm run dev:clean
 */
import { spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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
      `$c = Get-NetTCPConnection -LocalPort ${p} -ErrorAction SilentlyContinue; ` +
        `if ($c) { $c | Select-Object -ExpandProperty OwningProcess -Unique | ` +
        `ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } }`,
    ]);
    return;
  }
  await run("sh", ["-c", `lsof -ti:${p} | xargs kill -9 2>/dev/null || true`]);
}

async function main() {
  console.log("[dev:clean] Stopping stale dev servers on ports", ports.join(", "));
  for (const p of ports) await killPort(p);

  const nextDir = join(root, ".next");
  if (existsSync(nextDir)) {
    console.log("[dev:clean] Removing .next cache");
    rmSync(nextDir, { recursive: true, force: true });
  }

  console.log(`[dev:clean] Starting Next.js → http://localhost:${port}`);
  console.log("[dev:clean] Keep this terminal open. Use Ctrl+C to stop.\n");

  const nextBin = join(root, "node_modules", "next", "dist", "bin", "next");
  const child = spawn(process.execPath, [nextBin, "dev", "-p", port], {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, PORT: port },
  });

  child.on("exit", (code) => process.exit(code ?? 0));
}

main().catch((err) => {
  console.error("[dev:clean] Failed:", err);
  process.exit(1);
});
