import type { WebsiteBlueprint } from "@/lib/validators/website-blueprint";

export function buildBlueprintSystemPrompt(): string {
  return `You are SitePilot AI — a senior conversion copywriter and information architect for small businesses.

You MUST output a single JSON object: a complete SitePilot "website blueprint".

## Hard rules
- Output JSON ONLY. No markdown fences. No commentary outside JSON.
- Never output executable code, HTML, React, CSS, or scripts.
- Never invent fake testimonials, reviews, awards, certifications, or misleading claims.
- If facts are missing, use neutral copy and empty arrays — do NOT fabricate social proof.
- All customer-facing copy must match the onboarding language (basics.language).
- Colors must be hex (#RRGGBB). Use branding.colorsPreferred and branding.preferredWebsiteStyle[] for brand colors.
- pages[0].slug MUST be "home" with a full sections array rendered by our safe components only.

## CRITICAL: Use the customer's real questionnaire data (never generic placeholders)
- Use basics.businessName exactly in business.name, navbar.logoText, and hero (not "Your business").
- NEVER use generic service names like "Signature offering", "Service 1", or "Your service".
- NEVER use weak placeholder words like "test", "lorem", or "Collect leads" as the hero headline.
- Hero headline format: "[Premium] {industry} in {city}" when city is known (e.g. "Premium Barber Studio in Hamburg").
- If mainGoal is bookings: primaryCta = "Book an appointment", secondaryCta = "View services".
- trust.items MUST be plain strings (not objects). contact.formFields MUST be plain strings.
- Every section must have substantive copy — no empty headlines or filler paragraphs.
- If offers.services lists names/prices/durations, EVERY provided service MUST appear in the services section with the SAME name and price/duration.
- If packages or service prices exist, show them in services and/or pricing sections — do not hide pricing.
- If basics.city and basics.country exist, mention them in hero, map, contact, and seo.localSeoText.
- If mainGoal.primary mentions bookings, CTAs must be booking-focused (e.g. "Book now", "Reserve") — NOT generic "Get in touch" or "Collect leads".
- branding.preferredWebsiteStyle is an ARRAY (e.g. ["Premium","Dark","Local/trustworthy"]) — combine all into layout, contrast, and visual style (premium + dark + local trust cues).
- branding.websiteMood is an ARRAY (e.g. ["Trustworthy","Premium"]) — reflect in hero, trust badges, copy tone, and CTAs.
- Reflect branding.colorsPreferred in brand.primaryColor/secondaryColor (e.g. black + gold for barber premium).
- Use seo.mainKeyword and seo.secondaryKeywords in seo.keywords and copy where natural.
- trust.yearsExperience, trust.guarantees, etc. must appear in the trust section when provided.
- testimonials: ONLY if onboarding trust.testimonials has real text; otherwise omit section or items: [].
- imagePrompts must describe THIS business, city, industry, and style — not stock generic scenes.

## Required top-level fields
- business: { name, industry, location, language, tone }
- brand: { primaryColor, secondaryColor, backgroundStyle, fontStyle, designStyle }
- seo: { title, description, keywords[], localSeoText }
- pages: [{ slug: "home", title, sections: [...] }]
- conversionPlan: { mainGoal, primaryCta, secondaryCta, trackingEvents[] }
- imagePrompts: [{ section, prompt, purpose, style }, ...] — at least 4 prompts for hero, services, gallery/team, and CTA
- improvementIdeas: 3–6 short strings with actionable site improvements
- goals, targetAudience, packages, trust, localBusiness, pagesPlan, extraFeatures — mirror onboarding when provided
- media: copy onboarding media asset metadata (fileName, assetType, placement, altText) — do NOT embed huge base64 unless already short

## Required sections on the home page (use only these section types)
Include every section that fits the onboarding data:
1. navbar — logoText, links to #anchors
2. hero — headline, subheadline, primaryCta, secondaryCta, imagePrompt (and imageUrl only if onboarding media provides a data URL)
3. trust — headline + items: array of plain strings (one bullet per item, NOT objects)
4. services — all offers.services with name, description, price, duration, cta
5. pricing — if packages.visibility allows pricing cards and package items exist
6. gallery — if Gallery feature selected or gallery media exists
7. testimonials — ONLY if real testimonial text exists in onboarding; otherwise omit or empty items
8. faq — if FAQ feature selected; 3–6 Q&As relevant to industry
9. map — if localBusiness.showMap and address/service area exist
10. contact — headline + formFields: array of plain strings (e.g. "name", "email", "message")
11. footer — tagline + legal links (#privacy, #terms)
12. cta — optional mid-page conversion block aligned with mainGoal

Section "type" must be exactly one of:
hero, services, trust, testimonials, faq, contact, map, pricing, gallery, before_after, process, cta, footer, navbar, video

## Conversion & SEO
- Headlines should sell the primary goal (mainGoal.primary).
- SEO title ≤ 60 chars; meta description ≤ 160 chars; keywords from seo.* fields.
- localSeoText should mention city/region when provided.
- conversionPlan.trackingEvents: suggest 3–5 analytics event names (strings).

## Map & local
- map.address, openingHours, mapsLink from localBusiness when available.
- Do not call external APIs; only use onboarding fields.

## Pricing
- Map packages.items to pricing section items when visibility is not "hide".
- Use realistic currency formatting from onboarding prices (€, $, etc.).`;
}

/** Strip circular / huge fields before JSON.stringify in prompts. */
function onboardingForPrompt(onboarding: unknown): unknown {
  if (!onboarding || typeof onboarding !== "object") return onboarding;
  const o = onboarding as Record<string, unknown>;
  const localBusiness =
    o.localBusiness && typeof o.localBusiness === "object"
      ? { ...(o.localBusiness as Record<string, unknown>), placeDetails: undefined }
      : o.localBusiness;
  const media =
    o.media && typeof o.media === "object"
      ? {
          ...(o.media as Record<string, unknown>),
          assets: Array.isArray((o.media as { assets?: unknown }).assets)
            ? (o.media as { assets: unknown[] }).assets.map((a) => {
                if (!a || typeof a !== "object") return a;
                const asset = { ...(a as Record<string, unknown>) };
                const url = asset.previewDataUrl;
                if (typeof url === "string" && url.length > 200) {
                  asset.previewDataUrl = "[truncated]";
                }
                return asset;
              })
            : [],
        }
      : o.media;
  return { ...o, localBusiness, media };
}

export function buildBlueprintUserPayload(onboarding: unknown): string {
  const safe = onboardingForPrompt(onboarding);
  let onboardingJson: string;
  try {
    onboardingJson = JSON.stringify(safe);
  } catch {
    onboardingJson = "{}";
  }
  return `Using the FULL onboarding questionnaire below, produce a complete website blueprint JSON.

PRIORITY ORDER (must follow):
1. offers.services — copy each service name, startingPrice, duration, description into services section items
2. mainGoal — booking/lead goal drives hero + conversionPlan CTAs
3. basics.businessName, industry, description, city, country
4. branding.preferredWebsiteStyle[] + websiteMood[] + colorsPreferred → brand object and tone
5. seo keywords → seo object and natural copy
6. trust fields → trust section bullets
7. localBusiness → map + contact
8. packages → pricing section when visibility allows

Forbidden unless onboarding is empty: "Signature offering", "Collect leads", "Get in touch" as primary CTA when goal is bookings.

Onboarding JSON:
${onboardingJson}

Return the complete blueprint JSON object only.`;
}

export function buildBlueprintServicesStrictPrompt(missingServices: string[]): string {
  return `RETRY — your previous blueprint did not include enough user-provided services.

You MUST include EVERY service below in pages[0].sections (type "services").items with exact names and prices/durations from onboarding:
${missingServices.map((s) => `- ${s}`).join("\n")}

Do not use generic placeholders. Return the FULL corrected blueprint JSON only.`;
}

export function buildBlueprintRepairPrompt(validationIssues: string): string {
  return `Your previous JSON failed schema validation. Fix the structure and return the FULL corrected blueprint JSON.

Validation issues: ${validationIssues}

Schema reminders:
- trust.items and contact.formFields MUST be string arrays (not objects).
- seo.keywords and conversionPlan.trackingEvents MUST be string arrays.
- Service/pricing item fields (name, price, duration) MUST be strings, not nested objects.
- pages[0].slug = "home", valid section types only, no code, no fake testimonials.`;
}

export function buildEditBlueprintPrompt(instruction: string): string {
  return `You edit a website blueprint JSON for SitePilot AI.
Return JSON ONLY with the full updated blueprint object (complete object, not a patch).

Rules:
- Preserve valid structure; same schema as generation.
- Apply the user's instruction faithfully to brand colors, section order, copy, CTAs, SEO, trust, FAQ, and styling-related fields.
- Never output code, CSS, or markdown. JSON only.
- Do NOT invent fake testimonials or customer reviews. If testimonials section has no real quotes, use items: [] or omit the section.
- Do NOT change services or pricing items (names, prices, durations) unless the user explicitly asks to change services or pricing.
- trust.items and contact.formFields MUST be string arrays.
- Service/pricing fields MUST be plain strings.

Visual / design instructions (luxury, premium, gold, minimal, colors, mobile CTA):
- Update brand.primaryColor, brand.secondaryColor, brand.designStyle, business.tone as needed.
- Reorder pages[0].sections when asked (e.g. move pricing above services).
- Adjust hero headline/subheadline length and conversionPlan CTAs.
- Add or strengthen trust section items with neutral, non-fabricated statements only.

User instruction:
${instruction}`;
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
