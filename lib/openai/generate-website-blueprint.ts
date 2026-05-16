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

export const OPENAI_GENERATION_FAILED_MESSAGE =
  "Could not generate website draft with OpenAI.";

export type SafeErrorInfo = {
  name: string;
  message: string;
  code?: string;
  status?: number;
  type?: string;
  stack?: string;
};

function safeString(value: unknown, maxLen = 500): string {
  if (value == null) return "";
  if (typeof value === "string") return value.slice(0, maxLen);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function readMessage(error: unknown): string {
  if (typeof error === "string") return error.slice(0, 500);
  if (typeof error !== "object" || error === null) return "";
  const msg = (error as { message?: unknown }).message;
  return typeof msg === "string" ? msg.slice(0, 500) : "";
}

/** Extract primitive error fields only — never walks cause chains or circular objects. */
export function toSafeErrorInfo(error: unknown): SafeErrorInfo {
  const fallback: SafeErrorInfo = {
    name: "Error",
    message: "OpenAI generation failed",
  };

  try {
    if (OpenAiGenerationError.isInstance(error)) {
      const info: SafeErrorInfo = {
        name: error.name,
        message: error.message,
        code: error.code,
        status: error.statusCode,
      };
      if (process.env.NODE_ENV === "development" && error.stack) {
        info.stack = error.stack.slice(0, 2000);
      }
      return info;
    }

    if (typeof error === "string") {
      return { name: "Error", message: error.slice(0, 500) };
    }

    if (typeof error !== "object" || error === null) {
      return fallback;
    }

    const e = error as Record<string, unknown>;
    const info: SafeErrorInfo = {
      name: safeString(e.name) || "Error",
      message: readMessage(error) || fallback.message,
    };

    const code = safeString(e.code);
    if (code) info.code = code;

    const status =
      typeof e.status === "number"
        ? e.status
        : typeof e.statusCode === "number"
          ? e.statusCode
          : undefined;
    if (status !== undefined) info.status = status;

    const type = safeString(e.type);
    if (type) info.type = type;

    if (process.env.NODE_ENV === "development" && typeof e.stack === "string") {
      info.stack = e.stack.slice(0, 2000);
    }

    return info;
  } catch {
    return fallback;
  }
}

export class OpenAiGenerationError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: string;

  constructor(
    message: string,
    options?: { statusCode?: number; code?: string; details?: string },
  ) {
    super(message);
    this.name = "OpenAiGenerationError";
    this.statusCode = options?.statusCode ?? 502;
    this.code = options?.code ?? "openai_generation_failed";
    if (options?.details) {
      this.details = options.details.slice(0, 500);
    }
  }

  static isInstance(error: unknown): error is OpenAiGenerationError {
    return (
      error instanceof OpenAiGenerationError ||
      (typeof error === "object" &&
        error !== null &&
        (error as { name?: string }).name === "OpenAiGenerationError")
    );
  }
}

function isOpenAiAuthError(info: SafeErrorInfo): boolean {
  return info.status === 401 || info.code === "invalid_api_key";
}

/** Never throws; never re-wraps an existing OpenAiGenerationError with nested causes. */
function normalizeOpenAiFailure(error: unknown): OpenAiGenerationError {
  try {
    if (OpenAiGenerationError.isInstance(error)) {
      return error;
    }

    const safe = toSafeErrorInfo(error);

    if (isOpenAiAuthError(safe)) {
      const suffix = openAiKeySuffix();
      const hint = suffix ? ` (aktiver Schlüssel endet auf …${suffix})` : "";
      return new OpenAiGenerationError(`${OPENAI_KEY_INVALID_MESSAGE}${hint}`, {
        statusCode: 401,
        code: "openai_invalid_api_key",
        details: safe.message,
      });
    }

    return new OpenAiGenerationError(safe.message || OPENAI_GENERATION_FAILED_MESSAGE, {
      statusCode: safe.status ?? 502,
      code: safe.code ?? "openai_generation_failed",
      details:
        process.env.NODE_ENV === "development"
          ? safe.message || undefined
          : undefined,
    });
  } catch {
    return new OpenAiGenerationError(OPENAI_GENERATION_FAILED_MESSAGE, {
      statusCode: 502,
      code: "openai_generation_failed",
    });
  }
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

  for (let attempt = 0; attempt < 2; attempt++) {
    const issues = formatValidationIssues(current);
    if (!issues) {
      return enrichBlueprintFromOnboarding(
        parseWebsiteBlueprint(current),
        onboarding,
      );
    }
    if (attempt === 1) {
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
    console.error(
      "[generate-website] OpenAI generation failed",
      toSafeErrorInfo(error),
    );
    if (options.allowMockFallback) {
      console.warn("[SitePilot] OpenAI generation failed; using mock blueprint");
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
