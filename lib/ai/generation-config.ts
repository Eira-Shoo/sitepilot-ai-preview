import { hasOpenAiKey, isPublicDemoMode } from "@/lib/runtime";

export type GenerationSource = "openai" | "mock";
export type GenerationConfigState = "mock" | "openai" | "unconfigured";

export const OPENAI_KEY_MISSING_MESSAGE =
  "OpenAI API key is missing. Add OPENAI_API_KEY or enable demo mode.";

/** NEXT_PUBLIC_DEMO_MODE=1 → always mock. */
export function isMockGenerationForced(): boolean {
  return isPublicDemoMode();
}

/** Server-only: whether OpenAI can run (demo off + key present). */
export function canUseOpenAiGeneration(): boolean {
  return !isMockGenerationForced() && hasOpenAiKey();
}

export function getGenerationConfigState(): GenerationConfigState {
  if (isMockGenerationForced()) return "mock";
  if (hasOpenAiKey()) return "openai";
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
    openaiKeyDetected: hasOpenAiKey(),
    expectedSource: source,
  });
}

export function getPublicGenerationStatus() {
  return {
    demoMode: isPublicDemoMode(),
    openaiKeyDetected: hasOpenAiKey(),
    configState: getGenerationConfigState(),
    expectedSource: getExpectedGenerationSource(),
  };
}
