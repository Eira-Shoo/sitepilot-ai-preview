import type { OnboardingPayload } from "@/lib/validators/onboarding";
import type { WebsiteBlueprint } from "@/lib/validators/website-blueprint";
import { applyBlueprintOutputCleanup } from "@/lib/blueprint/blueprint-cleanup";

function homePage(bp: WebsiteBlueprint) {
  return bp.pages.find((p) => p.slug === "home") ?? bp.pages[0];
}

/** User explicitly asked to change services or pricing. */
export function instructionTargetsServicesOrPricing(instruction: string): boolean {
  const ins = instruction.toLowerCase();
  const mentionsOffer =
    /\b(services?|pricing|prices?|packages?|offers?|menu)\b/.test(ins);
  const mentionsChange =
    /\b(add|remove|delete|change|update|rename|new|extra|more|fewer|less|another|edit)\b/.test(
      ins,
    );
  return mentionsOffer && mentionsChange;
}

export function instructionAllowsTestimonialChanges(instruction: string): boolean {
  return /\b(testimonial|review|rating|quote from)\b/i.test(instruction);
}

type SectionType = WebsiteBlueprint["pages"][number]["sections"][number]["type"];

function restoreSectionFromOriginal(
  edited: WebsiteBlueprint,
  original: WebsiteBlueprint,
  type: SectionType,
): void {
  const home = homePage(edited);
  const origHome = homePage(original);
  if (!home || !origHome) return;

  const origSection = origHome.sections.find((s) => s.type === type);
  const idx = home.sections.findIndex((s) => s.type === type);
  if (!origSection || idx === -1) return;

  home.sections[idx] = structuredClone(origSection) as (typeof home.sections)[number];
}

function stripInventedTestimonials(
  original: WebsiteBlueprint,
  edited: WebsiteBlueprint,
): void {
  const home = homePage(edited);
  const origHome = homePage(original);
  if (!home || !origHome) return;

  const orig = origHome.sections.find((s) => s.type === "testimonials");
  const hadReal =
    orig?.type === "testimonials" &&
    orig.items.some(
      (t: { quote?: string }) => Boolean(t.quote?.trim() && t.quote.length > 12),
    );

  const section = home.sections.find((s) => s.type === "testimonials");
  if (!section || section.type !== "testimonials") return;

  if (!hadReal) {
    section.items = [];
  }
}

/**
 * After AI edit: keep exact services/pricing unless requested; block fake testimonials.
 */
export function applyBlueprintEditSafeguards(
  original: WebsiteBlueprint,
  edited: WebsiteBlueprint,
  instruction: string,
  onboarding?: OnboardingPayload | null,
): WebsiteBlueprint {
  const next = structuredClone(edited);

  if (!instructionTargetsServicesOrPricing(instruction)) {
    restoreSectionFromOriginal(next, original, "services");
    restoreSectionFromOriginal(next, original, "pricing");
  }

  if (!instructionAllowsTestimonialChanges(instruction)) {
    stripInventedTestimonials(original, next);
  }

  if (onboarding) {
    return applyBlueprintOutputCleanup(next, onboarding);
  }

  return next;
}
