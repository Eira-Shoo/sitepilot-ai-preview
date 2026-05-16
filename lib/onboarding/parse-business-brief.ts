import {
  EXTRA_FEATURES,
  FONT_STYLES,
  WEBSITE_GOALS,
  WEBSITE_MOODS,
  WEBSITE_STYLES,
} from "@/lib/intake/options";
import type { OnboardingPayload } from "@/lib/validators/onboarding";

export type BriefImportPreview = {
  businessName?: string;
  industry?: string;
  businessType?: string;
  city?: string;
  country?: string;
  language?: string;
  goal?: string;
  primaryCta?: string;
  secondaryCta?: string;
  targetAudience?: string;
  styles: string[];
  moods: string[];
  colors?: string;
  fontStyle?: string;
  services: {
    name: string;
    price?: string;
    duration?: string;
    description?: string;
  }[];
  trustPoints: string[];
  seoKeywords: string[];
  features: string[];
  warnings: string[];
};

type Section = "header" | "services" | "trust" | "seo" | "features";

type ServiceDraft = {
  name: string;
  price?: string;
  duration?: string;
  description?: string;
};

const SECTION_BY_HEADING: Record<string, Section> = {
  services: "services",
  trust: "trust",
  seo: "seo",
  "seo keywords": "seo",
  features: "features",
};

const NON_SERVICE_PHRASES = new Set(
  [
    "5 years experience",
    "clean studio",
    "easy online booking",
    "premium grooming",
    "barber hamburg",
    "men's haircut hamburg",
    "beard trim hamburg",
    "contact form",
    "booking button",
    "google maps",
    "faq",
    "gallery",
    "pricing cards",
    "trust badges",
    "sticky mobile cta",
  ].map((s) => s.toLowerCase()),
);

const FEATURE_NAMES_LOWER = new Set(EXTRA_FEATURES.map((f) => f.toLowerCase()));

function lineValue(line: string, keys: string[]): string | undefined {
  for (const key of keys) {
    const re = new RegExp(`^${key}\\s*[:：]\\s*(.+)$`, "i");
    const m = line.trim().match(re);
    if (m?.[1]) return m[1].trim();
  }
  return undefined;
}

function splitList(value: string): string[] {
  return value
    .split(/[,;|/]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function matchFromList<T extends string>(items: readonly T[], raw: string[]): T[] {
  const out: T[] = [];
  for (const part of raw) {
    const lower = part.toLowerCase();
    const hit = items.find((item) => item.toLowerCase() === lower);
    if (hit && !out.includes(hit)) out.push(hit);
  }
  return out;
}

function normalizeLabel(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function parseSectionHeader(line: string): Section | null {
  const trimmed = line.trim();
  const m = trimmed.match(/^([A-Za-z][A-Za-z0-9\s/&'+-]*)\s*:\s*$/);
  if (!m) return null;
  const key = m[1]!.toLowerCase().trim();
  return SECTION_BY_HEADING[key] ?? null;
}

function splitServiceParts(body: string): string[] {
  if (body.includes("|")) {
    return body.split("|").map((s) => s.trim()).filter(Boolean);
  }
  if (/[—–]/.test(body)) {
    return body.split(/[—–]/).map((s) => s.trim()).filter(Boolean);
  }
  const comma = body.split(",").map((s) => s.trim()).filter(Boolean);
  if (
    comma.length >= 2 &&
    comma[1] &&
    (/\d/.test(comma[1]) || /€|\$|eur|usd|gbp/i.test(comma[1]))
  ) {
    return comma;
  }
  return [body.trim()];
}

function parseServiceLine(line: string): ServiceDraft | null {
  const body = line.replace(/^[-*•]\s*/, "").replace(/^\d+\.\s*/, "").trim();
  if (!body) return null;

  const parts = splitServiceParts(body);
  if (parts.length >= 2) {
    return {
      name: parts[0] ?? "",
      price: parts[1],
      duration: parts[2],
      description: parts.length > 3 ? parts.slice(3).join(", ") : undefined,
    };
  }

  return { name: body };
}

function looksLikeNonService(name: string, draft?: ServiceDraft): boolean {
  const n = normalizeLabel(name);
  if (!n) return true;
  if (NON_SERVICE_PHRASES.has(n)) return true;
  if (FEATURE_NAMES_LOWER.has(n)) return true;

  if (/\bhamburg\b/.test(n) && !/€|\$|min\b/i.test(name)) return true;
  if (/years?\s+experience/i.test(n)) return true;
  if (n === "clean studio" || n === "easy online booking" || n === "premium grooming") {
    return true;
  }

  const hasPrice = Boolean(draft?.price?.trim() || /\d+\s*€|€\s*\d+|\$\d+/i.test(name));
  const hasDuration = Boolean(draft?.duration?.trim() || /\d+\s*min/i.test(name));
  if (!hasPrice && !hasDuration && FEATURE_NAMES_LOWER.has(n)) return true;

  return false;
}

function pushService(
  preview: BriefImportPreview,
  svc: ServiceDraft,
  warnings: string[],
): void {
  const name = svc.name?.trim();
  if (!name) return;

  if (looksLikeNonService(name, svc)) {
    warnings.push(`Skipped non-service item in Services: "${name}"`);
    return;
  }

  preview.services.push({
    name,
    price: svc.price?.trim(),
    duration: svc.duration?.trim(),
    description: svc.description?.trim(),
  });
}

function pushTrust(preview: BriefImportPreview, value: string) {
  const t = value.trim();
  if (t) preview.trustPoints.push(t);
}

function pushSeo(preview: BriefImportPreview, value: string) {
  const t = value.trim();
  if (t) preview.seoKeywords.push(t);
}

function pushFeature(preview: BriefImportPreview, value: string) {
  const feat = value.trim();
  if (!feat) return;
  const matched = EXTRA_FEATURES.find((f) => f.toLowerCase() === feat.toLowerCase());
  preview.features.push(matched ?? feat);
}

function previewFromPartial(partial: Partial<OnboardingPayload>): BriefImportPreview {
  return {
    businessName: partial.basics?.businessName,
    industry: partial.basics?.industry,
    businessType: partial.basics?.businessType,
    city: partial.basics?.city,
    country: partial.basics?.country,
    language: partial.basics?.language,
    goal: partial.mainGoal?.primary,
    primaryCta: partial.mainGoal?.primaryCta,
    secondaryCta: partial.mainGoal?.secondaryCta,
    targetAudience: partial.targetAudience?.who,
    styles: partial.branding?.preferredWebsiteStyle ?? [],
    moods: partial.branding?.websiteMood ?? [],
    colors: partial.branding?.colorsPreferred,
    fontStyle: partial.branding?.fontStyle,
    services:
      partial.offers?.services?.map((s) => ({
        name: s.name ?? "",
        price: s.startingPrice,
        duration: s.duration,
        description: s.description || s.included,
      })) ?? [],
    trustPoints: [
      partial.trust?.yearsExperience,
      partial.trust?.certifications,
      partial.trust?.guarantees,
      partial.trust?.awards,
    ]
      .flatMap((t) => (t ? String(t).split(/\n/).map((x) => x.trim()) : []))
      .filter(Boolean),
    seoKeywords: [
      partial.seo?.mainKeyword,
      ...splitList(partial.seo?.secondaryKeywords ?? ""),
      ...splitList(partial.seo?.regionKeywords ?? ""),
    ].filter(Boolean) as string[],
    features: partial.extraFeatures ?? [],
    warnings: [],
  };
}

export function buildOnboardingFromPreview(
  preview: BriefImportPreview,
): Partial<OnboardingPayload> {
  const services = preview.services.map((s) => ({
    name: s.name,
    description: s.description ?? "",
    startingPrice: s.price ?? "",
    duration: s.duration ?? "",
    whoFor: "",
    included: s.description ?? "",
    cta: "Book now",
  }));

  const yearsMatch = preview.trustPoints.find((t) => /(\d+)\s*years?\s+experience/i.test(t));

  return {
    basics: {
      businessName: preview.businessName ?? "",
      industry: preview.industry ?? "",
      businessType: preview.businessType ?? "Local business",
      city: preview.city ?? "",
      country: preview.country ?? "",
      language: preview.language?.toLowerCase().includes("german")
        ? "de"
        : preview.language?.toLowerCase().includes("english")
          ? "en"
          : preview.language ?? "en",
      description: "",
      websiteUrl: "",
      social: {
        instagram: "",
        tiktok: "",
        youtube: "",
        facebook: "",
        linkedin: "",
      },
    },
    mainGoal: {
      primary: preview.goal ?? "Collect leads",
      primaryCta: preview.primaryCta ?? "Get in touch",
      secondaryCta: preview.secondaryCta ?? "View services",
    },
    targetAudience: {
      who: preview.targetAudience ?? "",
      problems: "",
      careAbout: "",
      feelTags: [],
    },
    offers: { services: services.length ? services : undefined },
    branding: {
      preferredWebsiteStyle: preview.styles,
      websiteMood: preview.moods,
      colorsPreferred: preview.colors ?? "",
      fontStyle: preview.fontStyle ?? "Modern",
    },
    trust: {
      yearsExperience: yearsMatch ?? "",
      guarantees: preview.trustPoints.filter((t) => !/years?\s+experience/i.test(t)).join("\n"),
    },
    seo: {
      mainKeyword: preview.seoKeywords[0] ?? "",
      secondaryKeywords: preview.seoKeywords.slice(1).join(", "),
    },
    extraFeatures: preview.features,
  } as unknown as Partial<OnboardingPayload>;
}

/** Parse structured plain-text business briefs (no AI). */
export function parseBusinessBriefText(text: string): {
  partial: Partial<OnboardingPayload>;
  preview: BriefImportPreview;
} {
  const lines = text.split(/\r?\n/);
  const warnings: string[] = [];
  const preview: BriefImportPreview = {
    styles: [],
    moods: [],
    services: [],
    trustPoints: [],
    seoKeywords: [],
    features: [],
    warnings,
  };

  let section: Section = "header";
  let serviceDraft: ServiceDraft | null = null;

  const flushServiceDraft = () => {
    if (!serviceDraft?.name?.trim()) {
      serviceDraft = null;
      return;
    }
    pushService(preview, serviceDraft, warnings);
    serviceDraft = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      if (section === "services") flushServiceDraft();
      continue;
    }

    const nextSection = parseSectionHeader(line);
    if (nextSection) {
      if (section === "services") flushServiceDraft();
      section = nextSection;
      continue;
    }

    const seoInline = line.match(/^seo(?:\s+keywords)?\s*[:：]\s*(.+)$/i);
    if (seoInline?.[1]?.trim()) {
      if (section === "services") flushServiceDraft();
      section = "seo";
      for (const kw of splitList(seoInline[1])) pushSeo(preview, kw);
      continue;
    }

    if (section === "services") {
      const numbered = line.match(/^(\d+)\.\s+(.+)$/);
      if (numbered && !line.includes(":")) {
        flushServiceDraft();
        serviceDraft = { name: numbered[2]!.trim() };
        continue;
      }

      const price = lineValue(line, ["Price", "Starting price"]);
      if (price && serviceDraft) {
        serviceDraft.price = price;
        continue;
      }

      const duration = lineValue(line, ["Duration", "Time"]);
      if (duration && serviceDraft) {
        serviceDraft.duration = duration;
        continue;
      }

      const description = lineValue(line, ["Description", "Details"]);
      if (description && serviceDraft) {
        serviceDraft.description = description;
        continue;
      }

      if (/^[-*•]/.test(line) || splitServiceParts(line.replace(/^[-*•]\s*/, "")).length >= 2) {
        flushServiceDraft();
        const svc = parseServiceLine(line);
        if (svc) pushService(preview, svc, warnings);
        continue;
      }

      if (serviceDraft && !lineValue(line, ["Price", "Duration", "Description"])) {
        flushServiceDraft();
      }
      continue;
    }

    if (section === "trust") {
      if (/^[-*•]/.test(line)) {
        pushTrust(preview, line.replace(/^[-*•]\s*/, ""));
      } else {
        pushTrust(preview, line);
      }
      continue;
    }

    if (section === "seo") {
      if (/^[-*•]/.test(line)) {
        pushSeo(preview, line.replace(/^[-*•]\s*/, ""));
      } else {
        for (const kw of splitList(line)) pushSeo(preview, kw);
      }
      continue;
    }

    if (section === "features") {
      if (/^[-*•]/.test(line)) {
        pushFeature(preview, line.replace(/^[-*•]\s*/, ""));
      } else {
        pushFeature(preview, line);
      }
      continue;
    }

    const businessName = lineValue(line, ["Business name", "Company name", "Name"]);
    if (businessName) preview.businessName = businessName;

    const industry = lineValue(line, ["Industry", "Sector"]);
    if (industry) preview.industry = industry;

    const businessType = lineValue(line, ["Business type", "Type"]);
    if (businessType) preview.businessType = businessType;

    const city = lineValue(line, ["City", "Location"]);
    if (city) preview.city = city;

    const country = lineValue(line, ["Country"]);
    if (country) preview.country = country;

    const language = lineValue(line, ["Website language", "Language"]);
    if (language) preview.language = language;

    const goal = lineValue(line, ["Goal", "Main goal", "Primary goal"]);
    if (goal) preview.goal = goal;

    const primaryCta = lineValue(line, ["Primary CTA", "Primary cta"]);
    if (primaryCta) preview.primaryCta = primaryCta;

    const secondaryCta = lineValue(line, ["Secondary CTA", "Secondary cta"]);
    if (secondaryCta) preview.secondaryCta = secondaryCta;

    const audience = lineValue(line, ["Target audience", "Audience"]);
    if (audience) preview.targetAudience = audience;

    const styles = lineValue(line, ["Preferred website style", "Website style", "Style"]);
    if (styles) {
      preview.styles = matchFromList(WEBSITE_STYLES, splitList(styles));
    }

    const moods = lineValue(line, ["Website mood", "Mood"]);
    if (moods) {
      preview.moods = matchFromList(WEBSITE_MOODS, splitList(moods));
    }

    const colors = lineValue(line, ["Preferred colors", "Colors", "Brand colors"]);
    if (colors) preview.colors = colors;

    const font = lineValue(line, ["Font style", "Font"]);
    if (font) {
      const hit = FONT_STYLES.find((f) => f.toLowerCase() === font.toLowerCase());
      preview.fontStyle = hit ?? font;
    }
  }

  if (section === "services") flushServiceDraft();

  if (preview.goal) {
    const goalHit = WEBSITE_GOALS.find(
      (g) => g.toLowerCase() === preview.goal!.toLowerCase(),
    );
    if (goalHit) preview.goal = goalHit;
  }

  preview.trustPoints = [...new Set(preview.trustPoints.map((t) => t.trim()).filter(Boolean))];
  preview.seoKeywords = [...new Set(preview.seoKeywords.map((t) => t.trim()).filter(Boolean))];
  preview.features = [...new Set(preview.features)];

  const partial = buildOnboardingFromPreview(preview);
  return { partial, preview };
}

export function previewFromOnboardingPartial(
  partial: Partial<OnboardingPayload>,
): BriefImportPreview {
  return previewFromPartial(partial);
}
