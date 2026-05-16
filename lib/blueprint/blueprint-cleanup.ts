import type { OnboardingPayload } from "@/lib/validators/onboarding";
import type { WebsiteBlueprint } from "@/lib/validators/website-blueprint";

export type ServiceCardItem = {
  name: string;
  description: string;
  price: string;
  duration: string;
  cta: string;
  whoFor: string;
  included: string;
  imageUrl: string;
};

const BROKEN_TEXT_PATTERNS = [
  /lorem/i,
  /\[object Object\]/i,
  /\btest\b/i,
  /signature offering/i,
  /collect leads/i,
  /details coming soon/i,
  /^tbd$/i,
  /^placeholder$/i,
];

const WEAK_SINGLE_WORDS = /^(test|lorem|placeholder|tbd|untitled)$/i;

export function cleanText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") {
    return value
      .replace(/\[object Object\]/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value
      .map((v) => cleanText(v))
      .filter(Boolean)
      .join(", ");
  }
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    const candidate =
      o.text ?? o.label ?? o.title ?? o.name ?? o.description ?? o.value ?? o.content;
    if (candidate != null && candidate !== value) return cleanText(candidate);
    return "";
  }
  return "";
}

export function isBrokenOrPlaceholderText(text: string): boolean {
  const t = cleanText(text);
  if (!t || t.length < 2) return true;
  if (WEAK_SINGLE_WORDS.test(t)) return true;
  return BROKEN_TEXT_PATTERNS.some((p) => p.test(t));
}

export function normalizeServiceName(name: string): string {
  return cleanText(name).toLowerCase().replace(/\s+/g, " ").trim();
}

export function dedupeByName<T extends { name?: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const key = normalizeServiceName(item.name ?? "");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export function serviceDescriptionFallback(name: string): string {
  const n = cleanText(name);
  if (!n) return "Professional service tailored to your needs.";
  return `Professional ${n.toLowerCase()} — book your appointment today.`;
}

function isBookingGoal(primary: string) {
  const g = primary.toLowerCase();
  return g.includes("book") || g.includes("appointment") || g.includes("reserv");
}

export function serviceCta(name: string, primaryGoal: string, explicit?: string) {
  if (explicit?.trim()) return cleanText(explicit);
  if (isBookingGoal(primaryGoal)) {
    const short = name.split(" ")[0] ?? name;
    return `Book ${short.toLowerCase()}`;
  }
  return "Learn more";
}

function hasFeature(extra: string[], label: string) {
  return extra.some((e) => e.toLowerCase() === label.toLowerCase());
}

export function shouldShowPricing(onboarding: OnboardingPayload): boolean {
  const extra = onboarding.extraFeatures ?? [];
  const packages = onboarding.packages.items ?? [];
  return (
    (!onboarding.packages.visibility.startsWith("No, ask users") &&
      (hasFeature(extra, "Pricing cards") || packages.some((p) => p.price?.trim()))) ||
    (onboarding.offers.services ?? []).some((s) => s.startingPrice?.trim())
  );
}

export function buildServiceItemsFromOnboarding(
  onboarding: OnboardingPayload,
  opts?: { imageUrlsByIndex?: string[]; primaryCta?: string },
): ServiceCardItem[] {
  const booking = isBookingGoal(onboarding.mainGoal.primary);
  const defaultCta =
    opts?.primaryCta?.trim() ||
    onboarding.mainGoal.primaryCta?.trim() ||
    (booking ? "Book an appointment" : "Get started");

  return (onboarding.offers.services ?? [])
    .filter((s) => s.name?.trim())
    .map((s, i) => {
      const name = cleanText(s.name);
      let description = cleanText(s.description);
      if (isBrokenOrPlaceholderText(description)) description = "";

      const whoFor = cleanText(s.whoFor);
      const included = cleanText(s.included);

      return {
        name,
        description,
        price: cleanText(s.startingPrice),
        duration: cleanText(s.duration),
        cta: serviceCta(name, onboarding.mainGoal.primary, s.cta) || defaultCta,
        whoFor: isBrokenOrPlaceholderText(whoFor) ? "" : whoFor,
        included: isBrokenOrPlaceholderText(included) ? "" : included,
        imageUrl: opts?.imageUrlsByIndex?.[i]?.trim() ?? "",
      };
    });
}

export function buildPricingItemsFromOnboarding(
  onboarding: OnboardingPayload,
  opts?: { imageUrlsByIndex?: string[]; primaryCta?: string },
): ServiceCardItem[] {
  if (!shouldShowPricing(onboarding)) return [];

  const booking = isBookingGoal(onboarding.mainGoal.primary);
  const primaryCta =
    opts?.primaryCta?.trim() ||
    onboarding.mainGoal.primaryCta?.trim() ||
    (booking ? "Book an appointment" : "Get started");

  const packages = (onboarding.packages.items ?? []).filter((p) => p.name?.trim());
  if (packages.length) {
    return packages.map((p) => ({
      name: cleanText(p.name),
      description: isBrokenOrPlaceholderText(p.features)
        ? cleanText(p.billing)
        : cleanText(p.features),
      price: cleanText(p.price) || "See details",
      duration: "",
      cta: primaryCta,
      whoFor: "",
      included: cleanText(p.features),
      imageUrl: "",
    }));
  }

  const services = buildServiceItemsFromOnboarding(onboarding, opts);
  if (!services.some((s) => s.price)) return [];

  return services.map((s) => ({
    ...s,
    cta: s.cta || primaryCta,
  }));
}

function cleanupServiceCardItem(item: ServiceCardItem): ServiceCardItem {
  const name = cleanText(item.name);
  let description = cleanText(item.description);
  if (isBrokenOrPlaceholderText(description)) description = "";

  return {
    name,
    description,
    price: cleanText(item.price),
    duration: cleanText(item.duration),
    cta: isBrokenOrPlaceholderText(item.cta) ? "Book now" : cleanText(item.cta),
    whoFor: isBrokenOrPlaceholderText(item.whoFor) ? "" : cleanText(item.whoFor),
    included: isBrokenOrPlaceholderText(item.included) ? "" : cleanText(item.included),
    imageUrl: cleanText(item.imageUrl),
  };
}

function sanitizeHeadline(value: string | undefined, fallback: string): string {
  const h = cleanText(value);
  return isBrokenOrPlaceholderText(h) ? fallback : h;
}

/** Enforce exact user services/pricing and section item limits on a finalized blueprint. */
export function applyBlueprintOutputCleanup(
  blueprint: WebsiteBlueprint,
  onboarding: OnboardingPayload,
): WebsiteBlueprint {
  const home = blueprint.pages[0];
  if (!home) return blueprint;

  const userServices = (onboarding.offers.services ?? []).filter((s) => s.name?.trim());
  const userServiceCount = userServices.length;
  const packageCount = (onboarding.packages.items ?? []).filter((p) => p.name?.trim()).length;

  const productAssets = onboarding.media.assets.filter(
    (a) =>
      a.previewDataUrl &&
      (a.assetType?.toLowerCase() === "product" ||
        a.placement.some((p) => p.toLowerCase().includes("services"))),
  );
  const imageUrlsByIndex = productAssets.map((a) => a.previewDataUrl ?? "");

  const serviceOpts = { imageUrlsByIndex };
  const exactServices = buildServiceItemsFromOnboarding(onboarding, serviceOpts);
  const exactPricing = buildPricingItemsFromOnboarding(onboarding, serviceOpts);

  const sections = home.sections.map((section) => {
    if (section.type === "services") {
      if (userServiceCount > 0) {
        return {
          ...section,
          headline: sanitizeHeadline(section.headline, "Our services"),
          items: exactServices.slice(0, userServiceCount),
        };
      }
      const items = dedupeByName(
        (section.items as ServiceCardItem[]).map((i) => cleanupServiceCardItem(i as ServiceCardItem)),
      );
      return { ...section, items };
    }

    if (section.type === "pricing") {
      if (exactPricing.length) {
        const max = packageCount > 0 ? packageCount : userServiceCount || exactPricing.length;
        return {
          ...section,
          headline: sanitizeHeadline(section.headline, "Transparent pricing"),
          items: dedupeByName(exactPricing).slice(0, max),
        };
      }
      const max = packageCount || userServiceCount;
      const items = dedupeByName(
        (section.items as ServiceCardItem[]).map((i) => cleanupServiceCardItem(i as ServiceCardItem)),
      );
      return { ...section, items: max > 0 ? items.slice(0, max) : items };
    }

    if (section.type === "trust") {
      const items = section.items
        .map((t: string) => cleanText(t))
        .filter((t: string) => t && !isBrokenOrPlaceholderText(t));
      return { ...section, items: [...new Set(items)].slice(0, 4) };
    }

    if (section.type === "faq") {
      const items = section.items
        .map((f: { question?: string; answer?: string }) => ({
          question: cleanText(f.question),
          answer: cleanText(f.answer),
        }))
        .filter(
          (f: { question: string; answer: string }) =>
            f.question && f.answer && !isBrokenOrPlaceholderText(f.question),
        );
      return { ...section, items: items.slice(0, 5) };
    }

    if (section.type === "process") {
      const items = section.items
        .map((p: { title?: string; description?: string }) => ({
          title: cleanText(p.title),
          description: cleanText(p.description),
        }))
        .filter((p: { title: string; description: string }) => p.title && !isBrokenOrPlaceholderText(p.title))
        .slice(0, 3);
      return { ...section, items };
    }

    if (section.type === "hero") {
      return {
        ...section,
        headline: cleanText(section.headline),
        subheadline: cleanText(section.subheadline),
        primaryCta: cleanText(section.primaryCta),
        secondaryCta: cleanText(section.secondaryCta),
      };
    }

    if (section.type === "cta") {
      return {
        ...section,
        headline: cleanText(section.headline),
        body: cleanText(section.body),
        primaryCta: cleanText(section.primaryCta),
        secondaryCta: cleanText(section.secondaryCta),
      };
    }

    return section;
  });

  return {
    ...blueprint,
    pages: [{ ...home, sections }],
  };
}
