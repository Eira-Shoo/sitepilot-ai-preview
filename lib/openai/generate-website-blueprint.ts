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
import { OPENAI_KEY_MISSING_MESSAGE } from "@/lib/ai/generation-messages";
import { resolveOpenAiApiKey } from "@/lib/openai/resolve-api-key";

export type BlueprintGenerationSource = "openai" | "mock";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unknown error";
}

function getErrorStatus(error: unknown): number | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as { status?: unknown }).status === "number"
  ) {
    return (error as { status: number }).status;
  }

  return undefined;
}

function getErrorCode(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
  ) {
    return (error as { code: string }).code;
  }

  return "openai_generation_failed";
}

export class OpenAiGenerationError extends Error {
  code: string;
  status?: number;
  details?: string;

  constructor(
    message: string,
    options?: { code?: string; status?: number; details?: string },
  ) {
    super(message);
    this.name = "OpenAiGenerationError";
    this.code = options?.code ?? "openai_generation_failed";
    this.status = options?.status;
    this.details = options?.details;
  }
}

function handleOpenAiCatch(error: unknown): never {
  if (error instanceof OpenAiGenerationError) {
    console.error("[OpenAI generation failed]", {
      code: error.code,
      status: error.status,
      message: error.message,
    });
    throw error;
  }

  const message = getErrorMessage(error);
  const status = getErrorStatus(error);
  const code = getErrorCode(error);

  console.error("[OpenAI generation failed]", {
    code,
    status,
    message,
  });

  throw new OpenAiGenerationError("Could not generate website draft with OpenAI.", {
    code,
    status,
    details: process.env.NODE_ENV === "development" ? message : undefined,
  });
}

function logGenerationSource(source: BlueprintGenerationSource) {
  if (process.env.NODE_ENV === "development") {
    console.log("Generation source:", source);
  }
}

function getClient() {
  const apiKey = resolveOpenAiApiKey();
  if (!apiKey) {
    throw new OpenAiGenerationError(OPENAI_KEY_MISSING_MESSAGE, {
      code: "openai_key_missing",
      status: 503,
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
  if (!raw) {
    throw new OpenAiGenerationError("OpenAI returned an empty response", {
      code: "openai_empty_response",
      status: 502,
    });
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new OpenAiGenerationError("OpenAI returned invalid JSON", {
      code: "openai_invalid_json",
      status: 502,
    });
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

  for (let attempt = 0; attempt < 2; attempt++) {
    const issues = formatValidationIssues(current);
    if (!issues) {
      return enrichBlueprintFromOnboarding(
        parseWebsiteBlueprint(current),
        onboarding,
      );
    }
    if (attempt === 1) {
      throw new OpenAiGenerationError(`Blueprint validation failed: ${issues}`, {
        code: "blueprint_validation_failed",
        status: 502,
        details: process.env.NODE_ENV === "development" ? issues : undefined,
      });
    }
    current = await requestBlueprintJson(
      openai,
      onboarding,
      buildBlueprintRepairPrompt(issues),
    );
  }

  throw new OpenAiGenerationError("Blueprint validation failed", {
    code: "blueprint_validation_failed",
    status: 502,
  });
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
      throw new OpenAiGenerationError(OPENAI_KEY_MISSING_MESSAGE, {
        code: "openai_key_missing",
        status: 503,
      });
    }
    const blueprint = await generateBlueprintFromOpenAi(data);
    const source: BlueprintGenerationSource = "openai";
    logGenerationSource(source);
    return { blueprint, source };
  } catch (error) {
    if (options.allowMockFallback) {
      console.warn("[SitePilot] OpenAI generation failed; using mock blueprint");
      const source: BlueprintGenerationSource = "mock";
      logGenerationSource(source);
      return {
        blueprint: buildWebsiteBlueprintFromOnboarding(data),
        source,
      };
    }
    handleOpenAiCatch(error);
  }
}
