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
};

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

function parseServiceBullet(line: string): BriefImportPreview["services"][number] | null {
  const body = line.replace(/^[-*•]\s*/, "").trim();
  if (!body) return null;

  const pipe = body.split("|").map((s) => s.trim());
  if (pipe.length >= 2) {
    return {
      name: pipe[0] ?? "",
      price: pipe[1],
      duration: pipe[2],
      description: pipe.length > 3 ? pipe.slice(3).join(" | ") : undefined,
    };
  }

  const comma = body.split(",").map((s) => s.trim());
  if (comma.length >= 2) {
    return {
      name: comma[0] ?? "",
      price: comma[1],
      duration: comma[2],
      description: comma.slice(3).join(", "),
    };
  }

  return { name: body };
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
    ].filter(Boolean) as string[],
    seoKeywords: [
      partial.seo?.mainKeyword,
      ...splitList(partial.seo?.secondaryKeywords ?? ""),
      ...splitList(partial.seo?.regionKeywords ?? ""),
    ].filter(Boolean) as string[],
    features: partial.extraFeatures ?? [],
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

  const trustText = preview.trustPoints.join("\n");
  const yearsMatch = trustText.match(/(\d+)\s*years?\s+experience/i);

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
      yearsExperience: yearsMatch
        ? `${yearsMatch[1]} years experience`
        : preview.trustPoints.find((t) => /years?\s+experience/i.test(t)) ?? "",
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
  const preview: BriefImportPreview = {
    styles: [],
    moods: [],
    services: [],
    trustPoints: [],
    seoKeywords: [],
    features: [],
  };

  let section = "header";

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const sectionHeader = line.match(/^([A-Za-z][\w\s/&-]*)\s*:?\s*$/);
    if (sectionHeader && !line.includes(":")) {
      const name = sectionHeader[1]!.toLowerCase();
      if (name.startsWith("service")) section = "services";
      else if (name === "trust") section = "trust";
      else if (name.startsWith("seo")) section = "seo";
      else if (name.startsWith("feature")) section = "features";
      else section = "header";
      continue;
    }

    if (section === "services" && /^[-*•]/.test(line)) {
      const svc = parseServiceBullet(line);
      if (svc) preview.services.push(svc);
      continue;
    }

    if (section === "trust" && /^[-*•]/.test(line)) {
      preview.trustPoints.push(line.replace(/^[-*•]\s*/, "").trim());
      continue;
    }

    if (section === "seo" && /^[-*•]/.test(line)) {
      preview.seoKeywords.push(line.replace(/^[-*•]\s*/, "").trim());
      continue;
    }

    if (section === "features" && /^[-*•]/.test(line)) {
      const feat = line.replace(/^[-*•]\s*/, "").trim();
      const matched = EXTRA_FEATURES.find(
        (f) => f.toLowerCase() === feat.toLowerCase(),
      );
      preview.features.push(matched ?? feat);
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

    if (/^[-*•]/.test(line) && section === "header") {
      const svc = parseServiceBullet(line);
      if (svc?.name) preview.services.push(svc);
    }
  }

  if (preview.goal) {
    const goalHit = WEBSITE_GOALS.find(
      (g) => g.toLowerCase() === preview.goal!.toLowerCase(),
    );
    if (goalHit) preview.goal = goalHit;
  }

  const partial = buildOnboardingFromPreview(preview);
  return { partial, preview };
}

export function previewFromOnboardingPartial(
  partial: Partial<OnboardingPayload>,
): BriefImportPreview {
  return previewFromPartial(partial);
}
