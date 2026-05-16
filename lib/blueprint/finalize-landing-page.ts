import type { OnboardingPayload } from "@/lib/validators/onboarding";
import type { WebsiteBlueprint } from "@/lib/validators/website-blueprint";
import { buildParsedBlueprintFromOnboarding } from "@/lib/blueprint/build-from-onboarding";
import { applyBlueprintOutputCleanup } from "@/lib/blueprint/blueprint-cleanup";
import { brandingCombinedForColors } from "@/lib/onboarding/branding-helpers";

const SECTION_ORDER: WebsiteBlueprint["pages"][number]["sections"][number]["type"][] = [
  "navbar",
  "hero",
  "trust",
  "services",
  "pricing",
  "process",
  "cta",
  "gallery",
  "testimonials",
  "before_after",
  "video",
  "faq",
  "map",
  "contact",
  "footer",
];

const WEAK_COPY =
  /^(test|lorem|placeholder|tbd|your business|signature offering|collect leads|get in touch|learn more|details coming soon\.)$/i;

function isWeakText(value: string | undefined): boolean {
  const t = value?.trim() ?? "";
  if (!t || t.length < 2) return true;
  return WEAK_COPY.test(t);
}

function sectionSortIndex(type: string): number {
  const i = SECTION_ORDER.indexOf(type as (typeof SECTION_ORDER)[number]);
  return i === -1 ? 50 : i;
}

function isSectionEmpty(
  section: WebsiteBlueprint["pages"][number]["sections"][number],
): boolean {
  switch (section.type) {
    case "trust":
    case "services":
    case "pricing":
    case "testimonials":
    case "gallery":
    case "faq":
    case "process":
      return !("items" in section) || !(section.items as unknown[]).length;
    case "cta":
      return isWeakText(section.headline) && isWeakText(section.body);
    case "hero":
      return isWeakText(section.headline);
    default:
      return false;
  }
}

function bookingCtas(o: OnboardingPayload) {
  const goal = o.mainGoal.primary.toLowerCase();
  const isBooking = goal.includes("book") || goal.includes("appointment");
  return {
    primary: o.mainGoal.primaryCta?.trim() || (isBooking ? "Book an appointment" : "Get started"),
    secondary: o.mainGoal.secondaryCta?.trim() || (isBooking ? "View services" : "Learn more"),
  };
}

function buildHeroCopy(o: OnboardingPayload, businessName: string) {
  const city = o.basics.city?.trim();
  const industry = o.basics.industry?.trim() || "business";
  const combined = brandingCombinedForColors(o.branding).toLowerCase();
  const premium =
    combined.includes("premium") ||
    combined.includes("luxury") ||
    (combined.includes("gold") && combined.includes("black"));

  const headline =
    city && industry
      ? `${premium ? "Premium " : ""}${industry} in ${city}`
      : businessName;

  const subheadline =
    o.basics.description?.trim() ||
    `Professional ${industry.toLowerCase()}${city ? ` in ${city}` : ""} — clear pricing, easy booking, and a polished client experience.`;

  return { headline, subheadline };
}

/** Reorder sections, inject mock ground-truth blocks, strip empty/weak sections. */
export function finalizeLandingPageBlueprint(
  blueprint: WebsiteBlueprint,
  onboarding: OnboardingPayload,
): WebsiteBlueprint {
  const mock = buildParsedBlueprintFromOnboarding(onboarding);
  const mockHome = mock.pages[0];
  if (!blueprint.pages?.[0] || !mockHome) return mock;

  const businessName = onboarding.basics.businessName.trim() || mock.business.name;
  const ctas = bookingCtas(onboarding);
  const heroCopy = buildHeroCopy(onboarding, businessName);
  const userServices = (onboarding.offers.services ?? []).filter((s) => s.name?.trim());

  const mockByType = new Map(mockHome.sections.map((s) => [s.type, s]));

  let sections = blueprint.pages[0].sections.map((section) => {
    if (section.type === "hero") {
      const mockHero = mockByType.get("hero");
      const mh = mockHero?.type === "hero" ? mockHero : null;
      return {
        ...section,
        headline: isWeakText(section.headline) ? heroCopy.headline : section.headline,
        subheadline: isWeakText(section.subheadline) ? heroCopy.subheadline : section.subheadline,
        primaryCta: isWeakText(section.primaryCta) ? ctas.primary : section.primaryCta,
        secondaryCta: section.secondaryCta?.trim() || ctas.secondary,
        imagePrompt: section.imagePrompt?.trim() || mh?.imagePrompt || "",
        imageUrl: section.imageUrl?.trim() || mh?.imageUrl || "",
      };
    }

    if (section.type === "services" && userServices.length) {
      const mockServices = mockByType.get("services");
      if (mockServices?.type === "services") return mockServices;
    }

    if (section.type === "pricing") {
      const mockPricing = mockByType.get("pricing");
      if (mockPricing?.type === "pricing" && mockPricing.items.length) return mockPricing;
    }

    if (section.type === "trust") {
      const mockTrust = mockByType.get("trust");
      if (mockTrust?.type === "trust" && mockTrust.items.length) return mockTrust;
    }

    if (section.type === "testimonials") {
      const hasReal = (onboarding.trust.testimonials ?? []).some((t) => t.text?.trim());
      if (!hasReal) return { ...section, items: [] };
    }

    if (section.type === "navbar") {
      const mockNav = mockByType.get("navbar");
      return {
        ...section,
        logoText: businessName,
        links: section.links?.length
          ? section.links
          : mockNav?.type === "navbar"
            ? mockNav.links
            : section.links,
      };
    }

    return section;
  });

  const ensure = (type: WebsiteBlueprint["pages"][number]["sections"][number]["type"]) => {
    if (sections.some((s) => s.type === type)) return;
    const block = mockByType.get(type);
    if (block) sections.push(block);
  };

  if (userServices.length) ensure("services");
  const hasPrices =
    userServices.some((s) => s.startingPrice?.trim()) ||
    (onboarding.packages.items ?? []).some((p) => p.price?.trim());
  if (hasPrices) ensure("pricing");
  ensure("trust");
  ensure("process");

  const hasWhy = sections.some(
    (s) => s.type === "cta" && s.headline.toLowerCase().includes("why"),
  );
  if (!hasWhy) {
    const why = mockHome.sections.find(
      (s) => s.type === "cta" && s.headline.toLowerCase().includes("why"),
    );
    if (why) sections.push(why);
  }

  sections = sections.filter((s) => !isSectionEmpty(s));

  const seen = new Set<string>();
  sections = sections.filter((s) => {
    const key = s.type === "cta" ? `cta:${"headline" in s ? s.headline : ""}` : s.type;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  sections.sort((a, b) => sectionSortIndex(a.type) - sectionSortIndex(b.type));

  ensure("navbar");
  ensure("contact");
  ensure("footer");

  sections.sort((a, b) => sectionSortIndex(a.type) - sectionSortIndex(b.type));

  const finalized: WebsiteBlueprint = {
    ...blueprint,
    business: { ...mock.business, ...blueprint.business, name: businessName },
    brand: { ...mock.brand, ...blueprint.brand },
    seo: {
      ...mock.seo,
      ...blueprint.seo,
      title: blueprint.seo.title?.trim() || mock.seo.title,
      localSeoText: blueprint.seo.localSeoText?.trim() || mock.seo.localSeoText,
    },
    conversionPlan: {
      ...blueprint.conversionPlan,
      mainGoal: onboarding.mainGoal.primary.trim() || mock.conversionPlan.mainGoal,
      primaryCta: ctas.primary,
      secondaryCta: ctas.secondary,
    },
    pages: [{ ...blueprint.pages[0], sections }],
  };

  return applyBlueprintOutputCleanup(finalized, onboarding);
}
