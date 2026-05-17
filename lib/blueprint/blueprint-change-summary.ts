import type { WebsiteBlueprint } from "@/lib/validators/website-blueprint";

function homeSections(bp: WebsiteBlueprint) {
  const home = bp.pages.find((p) => p.slug === "home") ?? bp.pages[0];
  return home?.sections ?? [];
}

function sectionTypes(bp: WebsiteBlueprint): string[] {
  return homeSections(bp).map((s) => s.type);
}

function getServicesNames(bp: WebsiteBlueprint): string[] {
  const sec = homeSections(bp).find((s) => s.type === "services");
  if (!sec || sec.type !== "services") return [];
  return sec.items.map((i: { name?: string }) => i.name?.trim() ?? "").filter(Boolean);
}

export function summarizeBlueprintChanges(
  before: WebsiteBlueprint,
  after: WebsiteBlueprint,
): string[] {
  const changes: string[] = [];

  if (before.brand.primaryColor !== after.brand.primaryColor) {
    changes.push(`Primary color: ${before.brand.primaryColor} → ${after.brand.primaryColor}`);
  }
  if (before.brand.secondaryColor !== after.brand.secondaryColor) {
    changes.push(`Accent color: ${before.brand.secondaryColor} → ${after.brand.secondaryColor}`);
  }
  if (before.brand.designStyle !== after.brand.designStyle) {
    changes.push("Updated brand design style");
  }
  if (before.business.tone !== after.business.tone) {
    changes.push(`Tone: ${before.business.tone || "—"} → ${after.business.tone || "—"}`);
  }

  const beforeTypes = sectionTypes(before);
  const afterTypes = sectionTypes(after);
  if (beforeTypes.join(",") !== afterTypes.join(",")) {
    changes.push(`Section order: ${beforeTypes.join(" → ")} changed to ${afterTypes.join(" → ")}`);
  }

  const added = afterTypes.filter((t) => !beforeTypes.includes(t));
  const removed = beforeTypes.filter((t) => !afterTypes.includes(t));
  if (added.length) changes.push(`Added sections: ${added.join(", ")}`);
  if (removed.length) changes.push(`Removed sections: ${removed.join(", ")}`);

  const beforeHero = homeSections(before).find((s) => s.type === "hero");
  const afterHero = homeSections(after).find((s) => s.type === "hero");
  if (beforeHero?.type === "hero" && afterHero?.type === "hero") {
    if (beforeHero.headline !== afterHero.headline) {
      changes.push("Updated hero headline");
    }
    if (beforeHero.subheadline !== afterHero.subheadline) {
      const shorter =
        (afterHero.subheadline?.length ?? 0) < (beforeHero.subheadline?.length ?? 0);
      changes.push(shorter ? "Shortened hero subheadline" : "Updated hero subheadline");
    }
    if (beforeHero.primaryCta !== afterHero.primaryCta) {
      changes.push(`Primary CTA: "${beforeHero.primaryCta}" → "${afterHero.primaryCta}"`);
    }
    if (beforeHero.secondaryCta !== afterHero.secondaryCta) {
      changes.push(`Secondary CTA: "${beforeHero.secondaryCta}" → "${afterHero.secondaryCta}"`);
    }
  }

  if (before.conversionPlan.primaryCta !== after.conversionPlan.primaryCta) {
    changes.push(`Site primary CTA: "${before.conversionPlan.primaryCta}" → "${after.conversionPlan.primaryCta}"`);
  }

  const beforeServices = getServicesNames(before);
  const afterServices = getServicesNames(after);
  if (beforeServices.join("|") !== afterServices.join("|")) {
    changes.push(
      `Services list changed (${beforeServices.length} → ${afterServices.length} items)`,
    );
  } else if (beforeServices.length) {
    changes.push(`Services preserved (${beforeServices.length} items)`);
  }

  const beforeTrust = homeSections(before).find((s) => s.type === "trust");
  const afterTrust = homeSections(after).find((s) => s.type === "trust");
  if (beforeTrust?.type === "trust" && afterTrust?.type === "trust") {
    if (beforeTrust.items.length !== afterTrust.items.length) {
      changes.push(`Trust badges: ${beforeTrust.items.length} → ${afterTrust.items.length}`);
    } else if (
      beforeTrust.items.some((t: string, i: number) => t !== afterTrust.items[i])
    ) {
      changes.push("Updated trust badge copy");
    }
  }

  if (before.seo.localSeoText !== after.seo.localSeoText) {
    changes.push("Updated local SEO text");
  }
  if (before.seo.title !== after.seo.title) {
    changes.push("Updated SEO title");
  }

  const beforeFaq = homeSections(before).find((s) => s.type === "faq");
  const afterFaq = homeSections(after).find((s) => s.type === "faq");
  if (beforeFaq?.type === "faq" && afterFaq?.type === "faq") {
    if (afterFaq.items.length > beforeFaq.items.length) {
      changes.push(`Added ${afterFaq.items.length - beforeFaq.items.length} FAQ item(s)`);
    } else if (afterFaq.items.length < beforeFaq.items.length) {
      changes.push(`Removed ${beforeFaq.items.length - afterFaq.items.length} FAQ item(s)`);
    }
  }

  const beforeTest = homeSections(before).find((s) => s.type === "testimonials");
  const afterTest = homeSections(after).find((s) => s.type === "testimonials");
  if (beforeTest?.type === "testimonials" && afterTest?.type === "testimonials") {
    if (beforeTest.items.length !== afterTest.items.length) {
      changes.push(`Testimonials: ${beforeTest.items.length} → ${afterTest.items.length}`);
    }
  }

  if (!changes.length) {
    changes.push("Blueprint updated (minor or structural tweaks)");
  }

  return changes;
}
