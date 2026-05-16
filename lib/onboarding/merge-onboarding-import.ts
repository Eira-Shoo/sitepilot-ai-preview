import { coerceStringArray } from "@/lib/onboarding/branding-helpers";
import {
  defaultOnboardingPayload,
  onboardingSchema,
  type OnboardingPayload,
} from "@/lib/validators/onboarding";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mergeRecords<T extends Record<string, unknown>>(
  base: T,
  patch: unknown,
): T {
  if (!isPlainObject(patch)) return base;
  return { ...base, ...patch } as T;
}

/** Deep-merge partial import onto defaults, then validate. */
export function mergeOnboardingImport(partial: unknown): {
  success: true;
  data: OnboardingPayload;
} | {
  success: false;
  error: string;
} {
  const base = defaultOnboardingPayload();
  if (!isPlainObject(partial)) {
    return { success: false, error: "Import must be a JSON object." };
  }

  const p = partial;
  const merged = {
    ...base,
    ...p,
    basics: mergeRecords(base.basics, p.basics),
    mainGoal: mergeRecords(base.mainGoal, p.mainGoal),
    targetAudience: mergeRecords(base.targetAudience, p.targetAudience),
    offers: {
      ...base.offers,
      ...(isPlainObject(p.offers) ? p.offers : {}),
      services: Array.isArray((p.offers as { services?: unknown })?.services)
        ? (p.offers as { services: OnboardingPayload["offers"]["services"] }).services
        : base.offers.services,
    },
    packages: mergeRecords(base.packages, p.packages),
    branding: mergeRecords(base.branding, p.branding),
    media: mergeRecords(base.media, p.media),
    imageDirection: mergeRecords(base.imageDirection, p.imageDirection),
    localBusiness: mergeRecords(base.localBusiness, p.localBusiness),
    trust: mergeRecords(base.trust, p.trust),
    sitePages: mergeRecords(base.sitePages, p.sitePages),
    seo: mergeRecords(base.seo, p.seo),
    extraFeatures: Array.isArray(p.extraFeatures)
      ? p.extraFeatures.map(String)
      : base.extraFeatures,
  };

  const branding = merged.branding as OnboardingPayload["branding"] & {
    websiteStyle?: string;
    mood?: string;
  };
  merged.branding = {
    ...branding,
    preferredWebsiteStyle: coerceStringArray(
      branding.preferredWebsiteStyle ?? branding.websiteStyle,
    ),
    websiteMood: coerceStringArray(branding.websiteMood ?? branding.mood),
  };

  const parsed = onboardingSchema.safeParse(merged);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path.join(".") ?? "payload";
    return {
      success: false,
      error: `${path}: ${issue?.message ?? "Validation failed"}`,
    };
  }

  return { success: true, data: parsed.data };
}
