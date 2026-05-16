import OpenAI from "openai";
import { parseWebsiteBlueprint } from "@/lib/validators/website-blueprint";
import { buildEditBlueprintPrompt, buildRecommendationsPrompt } from "@/lib/ai/prompts";
import type { WebsiteBlueprint } from "@/lib/validators/website-blueprint";
import { mockEditBlueprint } from "@/lib/blueprint/mock-edit-blueprint";
import { createBlueprintFromOnboarding } from "@/lib/openai/generate-website-blueprint";
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

export async function editBlueprintWithInstruction(
  blueprint: WebsiteBlueprint,
  instruction: string,
): Promise<WebsiteBlueprint> {
  if (shouldUseMockAiGeneration()) {
    return mockEditBlueprint(blueprint, instruction);
  }

  const openai = getClient();
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.5,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You return JSON only — a complete SitePilot website blueprint object.",
      },
      {
        role: "user",
        content: `${buildEditBlueprintPrompt(instruction)}\n\nCurrent blueprint JSON:\n${JSON.stringify(blueprint)}`,
      },
    ],
  });
  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("Empty AI response");
  const parsed = JSON.parse(raw);
  return parseWebsiteBlueprint(parsed);
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
