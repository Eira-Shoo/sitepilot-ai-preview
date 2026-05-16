import { existsSync, readFileSync } from "fs";
import path from "path";

function sanitizeApiKey(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const key = raw
    .trim()
    .replace(/\r/g, "")
    .replace(/^['"]|['"]$/g, "");
  if (!key || key === "PASTE_OPENAI_KEY_HERE") return undefined;
  return key.length > 10 ? key : undefined;
}

function loadFromEnvLocalFile(): string | undefined {
  if (process.env.NODE_ENV === "production") return undefined;
  try {
    const filePath = path.join(process.cwd(), ".env.local");
    if (!existsSync(filePath)) return undefined;
    const content = readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
    const match = content.match(/^OPENAI_API_KEY\s*=\s*(.+)$/m);
    return sanitizeApiKey(match?.[1]);
  } catch {
    return undefined;
  }
}

let devOverrideApplied = false;

/**
 * In local dev, force `process.env.OPENAI_API_KEY` from `.env.local` so a stale
 * Windows user/system variable cannot override Next.js env files.
 */
export function applyDevOpenAiKeyFromEnvLocal(): void {
  if (devOverrideApplied || process.env.NODE_ENV === "production") return;

  const fromFile = loadFromEnvLocalFile();
  if (!fromFile) return;

  const fromProcess = sanitizeApiKey(process.env.OPENAI_API_KEY);
  if (fromProcess && fromProcess !== fromFile) {
    console.warn(
      `[SitePilot] Ignoring system OPENAI_API_KEY (…${fromProcess.slice(-4)}); using .env.local (…${fromFile.slice(-4)})`,
    );
  }

  process.env.OPENAI_API_KEY = fromFile;
  devOverrideApplied = true;
}

/** Resolves OpenAI API key (applies dev override first). */
export function resolveOpenAiApiKey(): string | undefined {
  applyDevOpenAiKeyFromEnvLocal();
  return sanitizeApiKey(process.env.OPENAI_API_KEY) ?? loadFromEnvLocalFile();
}

/** Last 4 characters — safe to expose for debugging which key is active. */
export function openAiKeySuffix(): string | null {
  const key = resolveOpenAiApiKey();
  if (!key || key.length < 4) return null;
  return key.slice(-4);
}
