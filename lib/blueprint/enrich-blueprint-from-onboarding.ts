import type { OnboardingPayload } from "@/lib/validators/onboarding";
import type { WebsiteBlueprint } from "@/lib/validators/website-blueprint";
import { buildWebsiteBlueprintFromOnboarding } from "@/lib/blueprint/build-from-onboarding";

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

/** Preserve uploaded media URLs and intake metadata when the model omits them. */
export function enrichBlueprintFromOnboarding(
  blueprint: WebsiteBlueprint,
  onboarding: OnboardingPayload,
): WebsiteBlueprint {
  const mock = buildWebsiteBlueprintFromOnboarding(onboarding);

  if (!blueprint.pages?.length || !blueprint.pages[0]?.sections?.length) {
    return mock;
  }

  const merged: WebsiteBlueprint = {
    ...blueprint,
    business: {
      ...mock.business,
      ...blueprint.business,
      name: blueprint.business.name?.trim() || mock.business.name,
      industry: blueprint.business.industry?.trim() || mock.business.industry,
      location: blueprint.business.location?.trim() || mock.business.location,
      language: blueprint.business.language || mock.business.language,
    },
    brand: { ...mock.brand, ...blueprint.brand },
    seo: {
      ...mock.seo,
      ...blueprint.seo,
      keywords: blueprint.seo.keywords?.length ? blueprint.seo.keywords : mock.seo.keywords,
    },
    conversionPlan: {
      ...mock.conversionPlan,
      ...blueprint.conversionPlan,
    },
    goals: blueprint.goals ?? mock.goals,
    targetAudience: blueprint.targetAudience ?? mock.targetAudience,
    packages: blueprint.packages ?? mock.packages,
    trust: blueprint.trust ?? mock.trust,
    localBusiness: blueprint.localBusiness ?? mock.localBusiness,
    pagesPlan: blueprint.pagesPlan ?? mock.pagesPlan,
    extraFeatures: blueprint.extraFeatures?.length ? blueprint.extraFeatures : mock.extraFeatures,
    media: blueprint.media?.length ? blueprint.media : mock.media,
    improvementIdeas: blueprint.improvementIdeas?.length
      ? blueprint.improvementIdeas
      : mock.improvementIdeas,
    imagePrompts: blueprint.imagePrompts?.length ? blueprint.imagePrompts : mock.imagePrompts,
    services: blueprint.services?.length ? blueprint.services : mock.services,
  };

  const home = merged.pages[0]!;
  const mockHome = mock.pages[0]!;

  merged.pages[0] = {
    ...home,
    sections: home.sections.map((section) => {
      const mockSection = mockHome.sections.find((s) => s.type === section.type);
      if (!mockSection) return section;

      if (section.type === "hero" && mockSection.type === "hero") {
        return {
          ...section,
          imageUrl: section.imageUrl?.trim() || mockSection.imageUrl,
          imagePrompt: section.imagePrompt?.trim() || mockSection.imagePrompt,
        };
      }
      if (section.type === "navbar" && mockSection.type === "navbar") {
        return {
          ...section,
          logoUrl: section.logoUrl?.trim() || mockSection.logoUrl,
          logoText: section.logoText?.trim() || mockSection.logoText,
        };
      }
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
      return section;
    }),
  };

  if (!merged.pages[0].sections.some((s) => s.type === "contact")) {
    const contact = mockHome.sections.find((s) => s.type === "contact");
    if (contact) merged.pages[0].sections.push(contact);
  }
  if (
    onboarding.localBusiness.showMap &&
    onboarding.localBusiness.address?.trim() &&
    !merged.pages[0].sections.some((s) => s.type === "map")
  ) {
    const map = sectionByType(mock, "map");
    if (map) merged.pages[0].sections.push(map);
  }

  return merged;
}
