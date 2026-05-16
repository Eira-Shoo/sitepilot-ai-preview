import OpenAI from "openai";
import type { OnboardingPayload } from "@/lib/validators/onboarding";
import { onboardingSchema } from "@/lib/validators/onboarding";
import {
  parseWebsiteBlueprint,
  safeParseWebsiteBlueprint,
} from "@/lib/validators/website-blueprint";
import type { WebsiteBlueprint } from "@/lib/validators/website-blueprint";
import { buildWebsiteBlueprintFromOnboarding } from "@/lib/blueprint/build-from-onboarding";
import { enrichBlueprintFromOnboarding } from "@/lib/blueprint/enrich-blueprint-from-onboarding";
import { validateProvidedServicesInBlueprint } from "@/lib/blueprint/validate-blueprint-onboarding";
import {
  buildBlueprintRepairPrompt,
  buildBlueprintServicesStrictPrompt,
  buildBlueprintSystemPrompt,
  buildBlueprintUserPayload,
} from "@/lib/ai/prompts";
import { hasOpenAiKey, shouldUseMockAiGeneration } from "@/lib/runtime";

export type BlueprintGenerationSource = "openai" | "mock";

export class OpenAiGenerationError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "OpenAiGenerationError";
  }
}

function logGenerationSource(source: BlueprintGenerationSource) {
  if (process.env.NODE_ENV === "development") {
    console.log("Generation source:", source);
  }
}

function getClient() {
  if (!hasOpenAiKey()) {
    throw new OpenAiGenerationError("OPENAI_API_KEY is not configured");
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

async function requestBlueprintJson(
  openai: OpenAI,
  onboarding: OnboardingPayload,
  repairHint?: string,
): Promise<unknown> {
  const userContent = repairHint
    ? `${buildBlueprintUserPayload(onboarding)}\n\n${repairHint}`
    : buildBlueprintUserPayload(onboarding);

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
    temperature: 0.55,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: buildBlueprintSystemPrompt() },
      { role: "user", content: userContent },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new OpenAiGenerationError("OpenAI returned an empty response");

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new OpenAiGenerationError("OpenAI returned invalid JSON");
  }
}

async function parseAndEnrich(
  parsed: unknown,
  onboarding: OnboardingPayload,
): Promise<WebsiteBlueprint> {
  const validated = safeParseWebsiteBlueprint(parsed);
  if (!validated.success) {
    throw new OpenAiGenerationError(
      `Blueprint validation failed: ${validated.error.issues[0]?.message ?? "invalid structure"}`,
    );
  }
  return enrichBlueprintFromOnboarding(parseWebsiteBlueprint(validated.data), onboarding);
}

async function generateBlueprintFromOpenAi(
  onboarding: OnboardingPayload,
): Promise<WebsiteBlueprint> {
  const openai = getClient();
  let parsed: unknown = await requestBlueprintJson(openai, onboarding);

  const validated = safeParseWebsiteBlueprint(parsed);
  if (!validated.success) {
    const issues = validated.error.issues
      .slice(0, 12)
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    parsed = await requestBlueprintJson(openai, onboarding, buildBlueprintRepairPrompt(issues));
  }

  let blueprint = await parseAndEnrich(parsed, onboarding);

  const serviceCheck = validateProvidedServicesInBlueprint(blueprint, onboarding);
  if (!serviceCheck.ok && serviceCheck.missing.length > 0) {
    parsed = await requestBlueprintJson(
      openai,
      onboarding,
      buildBlueprintServicesStrictPrompt(serviceCheck.missing),
    );
    blueprint = await parseAndEnrich(parsed, onboarding);
  }

  return blueprint;
}

/**
 * Generate a website blueprint from the 14-step questionnaire.
 * - NEXT_PUBLIC_DEMO_MODE=1 → always mock (even if OPENAI_API_KEY is set).
 * - Missing OPENAI_API_KEY → mock.
 * - Otherwise → OpenAI; mock fallback only when allowMockFallback (public demo mode).
 */
export async function createBlueprintFromOnboarding(
  onboarding: unknown,
  options: { allowMockFallback: boolean },
): Promise<{ blueprint: WebsiteBlueprint; source: BlueprintGenerationSource }> {
  const parsedOnboarding = onboardingSchema.safeParse(onboarding);
  if (!parsedOnboarding.success) {
    throw new Error("Invalid onboarding payload");
  }
  const data = parsedOnboarding.data;

  if (shouldUseMockAiGeneration()) {
    const source: BlueprintGenerationSource = "mock";
    logGenerationSource(source);
    return {
      blueprint: buildWebsiteBlueprintFromOnboarding(data),
      source,
    };
  }

  try {
    const blueprint = await generateBlueprintFromOpenAi(data);
    const source: BlueprintGenerationSource = "openai";
    logGenerationSource(source);
    return { blueprint, source };
  } catch (error) {
    if (options.allowMockFallback) {
      console.warn("[SitePilot] OpenAI generation failed; using mock blueprint", error);
      const source: BlueprintGenerationSource = "mock";
      logGenerationSource(source);
      return {
        blueprint: buildWebsiteBlueprintFromOnboarding(data),
        source,
      };
    }
    const message =
      error instanceof OpenAiGenerationError
        ? error.message
        : error instanceof Error
          ? error.message
          : "OpenAI generation failed";
    throw new OpenAiGenerationError(message, error);
  }
}
