import type { OnboardingPayload } from "@/lib/validators/onboarding";
import type { WebsiteBlueprint } from "@/lib/validators/website-blueprint";
import { buildWebsiteBlueprintFromOnboarding } from "@/lib/blueprint/build-from-onboarding";
import { finalizeLandingPageBlueprint } from "@/lib/blueprint/finalize-landing-page";

function sectionByType<T extends WebsiteBlueprint["pages"][number]["sections"][number]["type"]>(
  blueprint: WebsiteBlueprint,
  type: T,
) {
  const home = blueprint.pages[0];
  if (!home) return undefined;
  return home.sections.find((s) => s.type === type) as Extract<
    WebsiteBlueprint["pages"][number]["sections"][number],
    { type: T }
  > | undefined;
}

const GENERIC_HEADLINE_SNIPPETS = ["collect leads", "get in touch", "your business"];

function isGenericHeroCopy(text: string, businessName: string) {
  const t = text.toLowerCase();
  if (!text.trim()) return true;
  if (GENERIC_HEADLINE_SNIPPETS.some((g) => t.includes(g)) && !t.includes(businessName.toLowerCase())) {
    return true;
  }
  return false;
}

/** Preserve uploaded media and ground-truth questionnaire data when the model omits or generalizes them. */
export function enrichBlueprintFromOnboarding(
  blueprint: WebsiteBlueprint,
  onboarding: OnboardingPayload,
): WebsiteBlueprint {
  const mock = buildWebsiteBlueprintFromOnboarding(onboarding);
  const businessName = onboarding.basics.businessName.trim() || mock.business.name;

  if (!blueprint.pages?.length || !blueprint.pages[0]?.sections?.length) {
    return mock;
  }

  const mockHome = mock.pages[0]!;
  const mockServices = mockHome.sections.find((s) => s.type === "services");
  const mockHero = mockHome.sections.find((s) => s.type === "hero");
  const mockTrust = mockHome.sections.find((s) => s.type === "trust");
  const mockPricing = mockHome.sections.find((s) => s.type === "pricing");
  const mockNavbar = mockHome.sections.find((s) => s.type === "navbar");

  const merged: WebsiteBlueprint = {
    ...blueprint,
    business: {
      name: businessName,
      industry: onboarding.basics.industry.trim() || mock.business.industry,
      location: [onboarding.basics.city, onboarding.basics.country].filter(Boolean).join(", ") || mock.business.location,
      language: onboarding.basics.language || mock.business.language,
      tone: blueprint.business.tone?.trim() || mock.business.tone,
    },
    brand: { ...mock.brand, ...blueprint.brand },
    seo: {
      title: blueprint.seo.title?.trim() || mock.seo.title,
      description: blueprint.seo.description?.trim() || mock.seo.description,
      keywords: mock.seo.keywords.length ? mock.seo.keywords : blueprint.seo.keywords,
      localSeoText: blueprint.seo.localSeoText?.trim() || mock.seo.localSeoText,
    },
    conversionPlan: {
      mainGoal: onboarding.mainGoal.primary.trim() || mock.conversionPlan.mainGoal,
      primaryCta: onboarding.mainGoal.primaryCta?.trim() || mock.conversionPlan.primaryCta,
      secondaryCta: onboarding.mainGoal.secondaryCta?.trim() || mock.conversionPlan.secondaryCta,
      trackingEvents: blueprint.conversionPlan.trackingEvents?.length
        ? blueprint.conversionPlan.trackingEvents
        : mock.conversionPlan.trackingEvents,
    },
    goals: mock.goals,
    targetAudience: mock.targetAudience,
    packages: mock.packages,
    trust: mock.trust,
    localBusiness: mock.localBusiness,
    pagesPlan: mock.pagesPlan,
    extraFeatures: mock.extraFeatures,
    media: blueprint.media?.length ? blueprint.media : mock.media,
    improvementIdeas: blueprint.improvementIdeas?.length
      ? blueprint.improvementIdeas
      : mock.improvementIdeas,
    imagePrompts: blueprint.imagePrompts?.length ? blueprint.imagePrompts : mock.imagePrompts,
    services: mock.services,
  };

  const home = merged.pages[0]!;

  merged.pages[0] = {
    ...home,
    sections: home.sections.map((section) => {
      const mockSection = mockHome.sections.find((s) => s.type === section.type);

      if (section.type === "services" && mockServices?.type === "services") {
        const userServices = (onboarding.offers.services ?? []).filter((s) => s.name?.trim());
        if (userServices.length > 0) {
          return { ...mockServices };
        }
      }

      if (section.type === "hero" && mockHero?.type === "hero") {
        const headline = section.headline ?? "";
        const sub = section.subheadline ?? "";
        return {
          ...section,
          headline: isGenericHeroCopy(headline, businessName) ? mockHero.headline : headline,
          subheadline: isGenericHeroCopy(sub, businessName) ? mockHero.subheadline : sub,
          primaryCta: section.primaryCta?.trim() || mockHero.primaryCta,
          secondaryCta: section.secondaryCta?.trim() || mockHero.secondaryCta,
          imageUrl: section.imageUrl?.trim() || mockHero.imageUrl,
          imagePrompt: section.imagePrompt?.trim() || mockHero.imagePrompt,
        };
      }

      if (section.type === "trust" && mockTrust?.type === "trust" && mockTrust.items.length) {
        return { ...mockTrust };
      }

      if (section.type === "pricing" && mockPricing?.type === "pricing" && mockPricing.items.length) {
        return { ...mockPricing };
      }

      if (section.type === "navbar" && mockNavbar?.type === "navbar") {
        return {
          ...section,
          logoText: businessName,
          logoUrl: section.logoUrl?.trim() || mockNavbar.logoUrl,
          links: section.links?.length ? section.links : mockNavbar.links,
        };
      }

      if (!mockSection) return section;

      if (section.type === "map" && mockSection.type === "map") {
        return {
          ...section,
          address: section.address?.trim() || mockSection.address,
          openingHours: section.openingHours?.trim() || mockSection.openingHours,
          mapsLink: section.mapsLink?.trim() || mockSection.mapsLink,
          placeId: section.placeId?.trim() || mockSection.placeId,
        };
      }

      if (section.type === "gallery" && mockSection.type === "gallery") {
        const hasUrls = section.items.some((i: { imageUrl?: string }) => i.imageUrl?.trim());
        if (
          !hasUrls &&
          mockSection.items.some((i: { imageUrl?: string }) => i.imageUrl?.trim())
        ) {
          return { ...section, items: mockSection.items };
        }
      }

      if (section.type === "testimonials") {
        const hasReal = (onboarding.trust.testimonials ?? []).some((t) => t.text?.trim());
        if (!hasReal) {
          return { ...section, items: [] };
        }
      }

      return section;
    }),
  };

  if (!merged.pages[0].sections.some((s) => s.type === "services") && mockServices) {
    merged.pages[0].sections.push(mockServices);
  }

  if (!merged.pages[0].sections.some((s) => s.type === "contact")) {
    const contact = mockHome.sections.find((s) => s.type === "contact");
    if (contact) merged.pages[0].sections.push(contact);
  }

  if (
    onboarding.localBusiness.showMap &&
    (onboarding.localBusiness.address?.trim() || onboarding.basics.city) &&
    !merged.pages[0].sections.some((s) => s.type === "map")
  ) {
    const map = sectionByType(mock, "map");
    if (map) merged.pages[0].sections.push(map);
  }

  return finalizeLandingPageBlueprint(merged, onboarding);
}
