/**
 * Sync .env.local → Vercel project env (Production + Preview) and trigger redeploy.
 *
 * Usage (once):
 *   set VERCEL_TOKEN=your_token_from_https://vercel.com/account/tokens
 *   npm run vercel:env
 *
 * Optional: VERCEL_PROJECT=sitepilot-ai-preview  VERCEL_TEAM_ID=team_xxx
 */
import { readFileSync, existsSync } from "fs";
import path from "path";

const TOKEN = process.env.VERCEL_TOKEN?.trim();
const PROJECT = process.env.VERCEL_PROJECT?.trim() || "sitepilot-ai-preview";
const TEAM_ID = process.env.VERCEL_TEAM_ID?.trim();
const APP_URL =
  process.env.VERCEL_APP_URL?.trim() || "https://sitepilot-ai-preview.vercel.app";

if (!TOKEN) {
  console.error("Missing VERCEL_TOKEN. Create one at https://vercel.com/account/tokens");
  process.exit(1);
}

function loadEnvLocal() {
  const file = path.join(process.cwd(), ".env.local");
  if (!existsSync(file)) {
    console.error("Missing .env.local");
    process.exit(1);
  }
  const content = readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  const get = (key) => {
    const m = content.match(new RegExp(`^${key}\\s*=\\s*(.+)$`, "m"));
    return m?.[1]?.trim().replace(/^['"]|['"]$/g, "").replace(/\r/g, "");
  };
  return {
    OPENAI_API_KEY: get("OPENAI_API_KEY"),
    NEXT_PUBLIC_DEMO_MODE: get("NEXT_PUBLIC_DEMO_MODE") || "0",
    NEXT_PUBLIC_APP_URL: get("NEXT_PUBLIC_APP_URL") || APP_URL,
  };
}

async function vercel(pathname, options = {}) {
  const url = new URL(pathname, "https://api.vercel.com");
  if (TEAM_ID) url.searchParams.set("teamId", TEAM_ID);
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`${res.status} ${pathname}: ${JSON.stringify(data)}`);
  }
  return data;
}

async function getProjectId() {
  const data = await vercel(`/v9/projects/${encodeURIComponent(PROJECT)}`);
  return data.id;
}

async function listEnv(projectId) {
  const data = await vercel(`/v10/projects/${projectId}/env`);
  return data.envs || [];
}

async function upsertEnv(projectId, key, value, type = "encrypted") {
  const existing = (await listEnv(projectId)).filter((e) => e.key === key);
  const targets = ["production", "preview"];

  for (const env of existing) {
    await vercel(`/v1/projects/${projectId}/env/${env.id}`, { method: "DELETE" });
  }

  await vercel(`/v10/projects/${projectId}/env`, {
    method: "POST",
    body: JSON.stringify({
      key,
      value,
      type,
      target: targets,
    }),
  });
  console.log(`  ✓ ${key} (${type}) → production, preview`);
}

async function redeploy(projectId) {
  const deployments = await vercel(`/v6/deployments?projectId=${projectId}&limit=1`);
  const latest = deployments.deployments?.[0];
  if (!latest?.uid) {
    console.log("No deployment found to redeploy; push to GitHub or deploy from dashboard.");
    return;
  }
  await vercel(`/v13/deployments/${latest.uid}/redeploy`, { method: "POST", body: "{}" });
  console.log("  ✓ Redeploy triggered");
}

async function main() {
  const env = loadEnvLocal();
  if (!env.OPENAI_API_KEY || env.OPENAI_API_KEY.length < 20) {
    console.error("OPENAI_API_KEY missing or invalid in .env.local");
    process.exit(1);
  }

  console.log(`Project: ${PROJECT}`);
  const projectId = await getProjectId();
  console.log(`Project id: ${projectId}`);
  console.log("Setting environment variables…");

  await upsertEnv(projectId, "OPENAI_API_KEY", env.OPENAI_API_KEY, "encrypted");
  await upsertEnv(projectId, "NEXT_PUBLIC_DEMO_MODE", "0", "plain");
  await upsertEnv(projectId, "NEXT_PUBLIC_APP_URL", APP_URL, "plain");

  console.log("Triggering redeploy…");
  await redeploy(projectId);

  console.log("\nDone. After deploy (~2 min), check:");
  console.log(`${APP_URL}/api/ai/generation-status`);
  console.log(`${APP_URL}/create`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
