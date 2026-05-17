import OpenAI from "openai";
import { buildRecommendationsPrompt } from "@/lib/ai/prompts";
import type { WebsiteBlueprint } from "@/lib/validators/website-blueprint";
import { createBlueprintFromOnboarding } from "@/lib/openai/generate-website-blueprint";
import { editBlueprintFromInstruction } from "@/lib/openai/edit-blueprint";
import { shouldUseMockAiGeneration } from "@/lib/runtime";
import { resolveOpenAiApiKey } from "@/lib/openai/resolve-api-key";

function getClient() {
  const apiKey = resolveOpenAiApiKey();
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");
  return new OpenAI({ apiKey });
}

/** @deprecated Prefer createBlueprintFromOnboarding for routing and fallback control. */
export async function generateBlueprintFromOnboarding(
  onboarding: unknown,
): Promise<WebsiteBlueprint> {
  const { blueprint } = await createBlueprintFromOnboarding(onboarding, {
    allowMockFallback: shouldUseMockAiGeneration(),
  });
  return blueprint;
}

/** @deprecated Use editBlueprintFromInstruction for changeSummary and safeguards. */
export async function editBlueprintWithInstruction(
  blueprint: WebsiteBlueprint,
  instruction: string,
): Promise<WebsiteBlueprint> {
  const result = await editBlueprintFromInstruction(blueprint, instruction, {
    allowMockFallback: shouldUseMockAiGeneration() || true,
  });
  return result.blueprint;
}

export async function recommendImprovements(
  blueprint: WebsiteBlueprint,
  metricsSummary: string,
): Promise<
  { recommendation_type: string; title: string; description: string; priority: string }[]
> {
  if (shouldUseMockAiGeneration()) {
    throw new Error("Recommendations require OpenAI (disabled in demo mode)");
  }
  const openai = getClient();
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.4,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "You return JSON only matching the requested recommendations schema.",
      },
      {
        role: "user",
        content: buildRecommendationsPrompt({ blueprint, metricsSummary }),
      },
    ],
  });
  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("Empty AI response");
  const parsed = JSON.parse(raw) as {
    recommendations: {
      recommendation_type: string;
      title: string;
      description: string;
      priority: string;
    }[];
  };
  return parsed.recommendations ?? [];
}
