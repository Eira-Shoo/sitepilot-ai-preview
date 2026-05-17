import OpenAI from "openai";
import type { OnboardingPayload } from "@/lib/validators/onboarding";
import { parseWebsiteBlueprint } from "@/lib/validators/website-blueprint";
import type { WebsiteBlueprint } from "@/lib/validators/website-blueprint";
import { buildEditBlueprintPrompt } from "@/lib/ai/prompts";
import { mockEditBlueprint } from "@/lib/blueprint/mock-edit-blueprint";
import { applyBlueprintEditSafeguards } from "@/lib/blueprint/blueprint-edit-safeguards";
import { summarizeBlueprintChanges } from "@/lib/blueprint/blueprint-change-summary";
import { canUseOpenAiGeneration, isMockGenerationForced } from "@/lib/ai/generation-config";
import { resolveOpenAiApiKey } from "@/lib/openai/resolve-api-key";
import { normalizeOpenAiBlueprintPayload } from "@/lib/blueprint/normalize-openai-blueprint";

export type BlueprintEditSource = "openai" | "mock";

export type BlueprintEditResult = {
  blueprint: WebsiteBlueprint;
  changeSummary: string[];
  source: BlueprintEditSource;
};

async function requestOpenAiBlueprintEdit(
  blueprint: WebsiteBlueprint,
  instruction: string,
): Promise<WebsiteBlueprint> {
  const apiKey = resolveOpenAiApiKey();
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

  const openai = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

  const completion = await openai.chat.completions.create({
    model,
    temperature: 0.35,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You return JSON only — a complete SitePilot website blueprint object. Never output code or markdown.",
      },
      {
        role: "user",
        content: `${buildEditBlueprintPrompt(instruction)}\n\nCurrent blueprint JSON:\n${JSON.stringify(blueprint)}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("OpenAI returned an empty response");

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("OpenAI returned invalid JSON");
  }

  const normalized = normalizeOpenAiBlueprintPayload(parsed);
  return parseWebsiteBlueprint(normalized);
}

export async function editBlueprintFromInstruction(
  blueprint: WebsiteBlueprint,
  instruction: string,
  options?: {
    onboarding?: OnboardingPayload | null;
    allowMockFallback?: boolean;
  },
): Promise<BlueprintEditResult> {
  const before = structuredClone(blueprint);
  const allowMock = options?.allowMockFallback !== false;
  let source: BlueprintEditSource = "mock";
  let edited: WebsiteBlueprint;

  const useOpenAi = canUseOpenAiGeneration() && !isMockGenerationForced();

  if (useOpenAi) {
    try {
      edited = await requestOpenAiBlueprintEdit(blueprint, instruction);
      source = "openai";
    } catch (e) {
      if (!allowMock) throw e;
      console.warn("[SitePilot] OpenAI edit failed, using mock:", e);
      edited = mockEditBlueprint(blueprint, instruction);
      source = "mock";
    }
  } else {
    edited = mockEditBlueprint(blueprint, instruction);
    source = "mock";
  }

  const safeguarded = applyBlueprintEditSafeguards(
    before,
    edited,
    instruction,
    options?.onboarding ?? null,
  );

  const validated = parseWebsiteBlueprint(safeguarded);
  const changeSummary = summarizeBlueprintChanges(before, validated);

  return { blueprint: validated, changeSummary, source };
}
