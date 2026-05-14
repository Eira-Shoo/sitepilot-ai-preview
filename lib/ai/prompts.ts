import type { WebsiteBlueprint } from "@/lib/validators/website-blueprint";

export function buildBlueprintSystemPrompt(): string {
  return `You are SitePilot AI — a senior conversion copywriter and information architect.
You MUST output a single JSON object matching the SitePilot blueprint schema.
Rules:
- Output JSON ONLY. No markdown fences. No commentary.
- Never output executable code, HTML, or React.
- Never invent fake testimonials, fake reviews, fake awards, or misleading claims.
- If you lack facts, use neutral placeholders clearly labeled as placeholders in copy (not as fake reviews).
- Prefer realistic, benefit-led copy for small businesses.
- Include SEO title/description and local SEO text when a location is known.
- Choose section order optimized for the stated business goal.
- Include a contact section and map section when address or place data exists.
- Use accessible contrast-friendly colors in hex format.
- The blueprint must include at least one page with slug "home".
- Section "type" must be one of: hero, services, trust, testimonials, faq, contact, map, pricing, gallery, before_after, process, cta, footer, navbar.
- For testimonials, only include clearly fictional placeholder quotes labeled as examples, OR empty items array. Prefer empty if unsure.
- imagePrompts: 3-6 strings describing hero and key section imagery (no copyrighted brands).
- improvementIdeas: 3-6 concise site improvements as strings.`;
}

export function buildBlueprintUserPayload(onboarding: unknown): string {
  return `Onboarding data (JSON):\n${JSON.stringify(onboarding)}\n\nReturn the website blueprint JSON.`;
}

export function buildEditBlueprintPrompt(instruction: string): string {
  return `You edit a website blueprint JSON for SitePilot AI.
Return JSON ONLY with the full updated blueprint object (complete object, not a patch).
Rules:
- Preserve valid structure; same schema as generation.
- Apply the user's instruction faithfully.
- Never output code. JSON only.
- Do not add fake reviews.

User instruction:\n${instruction}`;
}

export function buildRecommendationsPrompt(payload: {
  blueprint: WebsiteBlueprint;
  metricsSummary: string;
}): string {
  return `You analyze a small-business website blueprint and lightweight analytics summary.
Return JSON ONLY with shape:
{ "recommendations": [ { "recommendation_type": "conversion|seo|ux|trust", "title": "", "description": "", "priority": "low|medium|high" } ] }
Do not modify the blueprint. At least 3 recommendations, max 8.

Analytics summary:
${payload.metricsSummary}

Blueprint summary:
${JSON.stringify({
  business: payload.blueprint.business,
  seo: payload.blueprint.seo,
  conversionPlan: payload.blueprint.conversionPlan,
  sections: payload.blueprint.pages[0]?.sections?.map((s) => s.type),
})}`;
}
