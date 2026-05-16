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
import {
  assertGenerationConfigured,
  isMockGenerationForced,
  logGenerationConfigOnce,
} from "@/lib/ai/generation-config";
import { OPENAI_KEY_INVALID_MESSAGE, OPENAI_KEY_MISSING_MESSAGE } from "@/lib/ai/generation-messages";
import { openAiKeySuffix, resolveOpenAiApiKey } from "@/lib/openai/resolve-api-key";

export type BlueprintGenerationSource = "openai" | "mock";

export class OpenAiGenerationError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(
    message: string,
    cause?: unknown,
    options?: { statusCode?: number; code?: string },
  ) {
    super(message);
    this.name = "OpenAiGenerationError";
    this.cause = cause;
    this.statusCode = options?.statusCode ?? 502;
    this.code = options?.code ?? "openai_generation_failed";
  }
}

function isOpenAiAuthError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { status?: number; code?: string };
  return e.status === 401 || e.code === "invalid_api_key";
}

function normalizeOpenAiFailure(error: unknown): OpenAiGenerationError {
  if (error instanceof OpenAiGenerationError) return error;
  if (isOpenAiAuthError(error)) {
    const suffix = openAiKeySuffix();
    const hint = suffix ? ` (aktiver Schlüssel endet auf …${suffix})` : "";
    return new OpenAiGenerationError(`${OPENAI_KEY_INVALID_MESSAGE}${hint}`, error, {
      statusCode: 401,
      code: "openai_invalid_api_key",
    });
  }
  const message =
    error instanceof Error ? error.message : "OpenAI generation failed";
  return new OpenAiGenerationError(message, error);
}

function logGenerationSource(source: BlueprintGenerationSource) {
  if (process.env.NODE_ENV === "development") {
    console.log("Generation source:", source);
  }
}

function getClient() {
  const apiKey = resolveOpenAiApiKey();
  if (!apiKey) {
    throw new OpenAiGenerationError(OPENAI_KEY_MISSING_MESSAGE, undefined, {
      statusCode: 503,
      code: "openai_key_missing",
    });
  }
  return new OpenAI({ apiKey });
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

function formatValidationIssues(parsed: unknown): string | null {
  const validated = safeParseWebsiteBlueprint(parsed);
  if (validated.success) return null;
  return validated.error.issues
    .slice(0, 12)
    .map((i) => `${i.path.join(".")}: ${i.message}`)
    .join("; ");
}

async function parseAndEnrich(
  parsed: unknown,
  onboarding: OnboardingPayload,
  openai: OpenAI,
): Promise<WebsiteBlueprint> {
  let current = parsed;

  for (let attempt = 0; attempt < 3; attempt++) {
    const issues = formatValidationIssues(current);
    if (!issues) {
      return enrichBlueprintFromOnboarding(
        parseWebsiteBlueprint(current),
        onboarding,
      );
    }
    if (attempt === 2) {
      throw new OpenAiGenerationError(`Blueprint validation failed: ${issues}`);
    }
    current = await requestBlueprintJson(
      openai,
      onboarding,
      buildBlueprintRepairPrompt(issues),
    );
  }

  throw new OpenAiGenerationError("Blueprint validation failed");
}

async function generateBlueprintFromOpenAi(
  onboarding: OnboardingPayload,
): Promise<WebsiteBlueprint> {
  const openai = getClient();
  let parsed: unknown = await requestBlueprintJson(openai, onboarding);

  let blueprint = await parseAndEnrich(parsed, onboarding, openai);

  const serviceCheck = validateProvidedServicesInBlueprint(blueprint, onboarding);
  if (!serviceCheck.ok && serviceCheck.missing.length > 0) {
    parsed = await requestBlueprintJson(
      openai,
      onboarding,
      buildBlueprintServicesStrictPrompt(serviceCheck.missing),
    );
    blueprint = await parseAndEnrich(parsed, onboarding, openai);
  }

  return blueprint;
}

/**
 * Generate a website blueprint from the 14-step questionnaire.
 * - NEXT_PUBLIC_DEMO_MODE=1 → always mock (even if OPENAI_API_KEY is set).
 * - Missing key → error (503) unless demo mock fallback is allowed.
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

  logGenerationConfigOnce();

  if (isMockGenerationForced()) {
    const source: BlueprintGenerationSource = "mock";
    logGenerationSource(source);
    return {
      blueprint: buildWebsiteBlueprintFromOnboarding(data),
      source,
    };
  }

  try {
    try {
      assertGenerationConfigured();
    } catch {
      throw new OpenAiGenerationError(OPENAI_KEY_MISSING_MESSAGE);
    }
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
    throw normalizeOpenAiFailure(error);
  }
}
