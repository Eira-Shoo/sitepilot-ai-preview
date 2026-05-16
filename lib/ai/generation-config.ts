import { isOfflinePreview, isPublicDemoMode } from "@/lib/runtime";
import { openAiKeySuffix, resolveOpenAiApiKey } from "@/lib/openai/resolve-api-key";
import { OPENAI_KEY_MISSING_MESSAGE } from "@/lib/ai/generation-messages";

export type GenerationSource = "openai" | "mock";
export type GenerationConfigState = "mock" | "openai" | "unconfigured";

export { OPENAI_KEY_MISSING_MESSAGE };

function hasResolvedOpenAiKey(): boolean {
  return Boolean(resolveOpenAiApiKey());
}

/** NEXT_PUBLIC_DEMO_MODE=1 → always mock. */
export function isMockGenerationForced(): boolean {
  return isPublicDemoMode();
}

/** Server-only: whether OpenAI can run (demo off + key present). */
export function canUseOpenAiGeneration(): boolean {
  return !isMockGenerationForced() && hasResolvedOpenAiKey();
}

export function getGenerationConfigState(): GenerationConfigState {
  if (isMockGenerationForced()) return "mock";
  if (hasResolvedOpenAiKey()) return "openai";
  return "unconfigured";
}

export function getExpectedGenerationSource(): GenerationSource | null {
  const state = getGenerationConfigState();
  if (state === "openai") return "openai";
  if (state === "mock") return "mock";
  return null;
}

export function assertGenerationConfigured(): void {
  if (getGenerationConfigState() === "unconfigured") {
    throw new Error(OPENAI_KEY_MISSING_MESSAGE);
  }
}

/** Log once at server startup / first request in development. */
let loggedConfig = false;
export function logGenerationConfigOnce(): void {
  if (loggedConfig || process.env.NODE_ENV !== "development") return;
  loggedConfig = true;
  const state = getGenerationConfigState();
  const source = state === "openai" ? "openai" : state === "mock" ? "mock" : "unconfigured";
  console.log("[SitePilot] Generation config:", {
    demoMode: isPublicDemoMode(),
    openaiKeyDetected: hasResolvedOpenAiKey(),
    keySuffix: openAiKeySuffix(),
    expectedSource: source,
  });
}

export function getPublicGenerationStatus() {
  const demoMode = isPublicDemoMode();
  const openaiKeyDetected = hasResolvedOpenAiKey();
  return {
    /** NEXT_PUBLIC_DEMO_MODE=1 — forces mock generation only */
    demoMode,
    /** No Supabase URL/anon — preview deploy; does NOT block OpenAI when demo is off */
    offlinePreview: isOfflinePreview(),
    openaiKeyDetected,
    keySuffix: openAiKeySuffix(),
    configState: getGenerationConfigState(),
    expectedSource: getExpectedGenerationSource(),
  };
}
