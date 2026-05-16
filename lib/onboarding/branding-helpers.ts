import type { OnboardingPayload } from "@/lib/validators/onboarding";

export function coerceStringArray(value: unknown): string[] {
  if (value == null) return [];
  if (typeof value === "string") {
    const t = value.trim();
    return t ? [t] : [];
  }
  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === "string" ? v.trim() : String(v ?? "").trim()))
      .filter(Boolean);
  }
  return [];
}

export function toggleArrayValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

export function getPreferredWebsiteStyles(
  branding: OnboardingPayload["branding"],
): string[] {
  return branding.preferredWebsiteStyle?.length
    ? branding.preferredWebsiteStyle
    : [];
}

export function getWebsiteMoods(branding: OnboardingPayload["branding"]): string[] {
  return branding.websiteMood?.length ? branding.websiteMood : [];
}

/** Combined label for prompts, colors, and copy tone. */
export function brandingStyleText(branding: OnboardingPayload["branding"]): string {
  const styles = getPreferredWebsiteStyles(branding);
  return styles.length ? styles.join(", ") : "Modern";
}

export function brandingMoodText(branding: OnboardingPayload["branding"]): string {
  const moods = getWebsiteMoods(branding);
  return moods.length ? moods.join(", ") : "Trustworthy";
}

export function brandingCombinedForColors(branding: OnboardingPayload["branding"]): string {
  return `${brandingStyleText(branding)} ${brandingMoodText(branding)} ${branding.colorsPreferred}`.trim();
}
