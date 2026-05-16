import type { OnboardingPayload } from "@/lib/validators/onboarding";
import type { WebsiteBlueprint } from "@/lib/validators/website-blueprint";

const GENERIC_SERVICE_NAMES = [
  "signature offering",
  "service 1",
  "service 2",
  "untitled",
  "your service",
];

export function getProvidedServiceNames(onboarding: OnboardingPayload): string[] {
  return (onboarding.offers.services ?? [])
    .map((s) => s.name?.trim())
    .filter((n): n is string => Boolean(n));
}

function getServicesSectionItems(blueprint: WebsiteBlueprint) {
  const home = blueprint.pages[0];
  const section = home?.sections.find((s) => s.type === "services");
  if (!section || section.type !== "services") return [];
  return section.items;
}

function normalizeName(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function serviceNamesMatch(provided: string, generated: string) {
  const a = normalizeName(provided);
  const b = normalizeName(generated);
  return a === b || a.includes(b) || b.includes(a);
}

export function validateProvidedServicesInBlueprint(
  blueprint: WebsiteBlueprint,
  onboarding: OnboardingPayload,
): { ok: boolean; providedCount: number; matchedCount: number; missing: string[] } {
  const provided = getProvidedServiceNames(onboarding);
  if (provided.length < 2) {
    return { ok: true, providedCount: provided.length, matchedCount: provided.length, missing: [] };
  }

  const generated = getServicesSectionItems(blueprint).map(
    (i: { name?: string }) => i.name?.trim() ?? "",
  );
  const missing: string[] = [];

  for (const name of provided) {
    const hit = generated.some(
      (g: string) =>
        serviceNamesMatch(name, g) && !GENERIC_SERVICE_NAMES.includes(normalizeName(g)),
    );
    if (!hit) missing.push(name);
  }

  const matchedCount = provided.length - missing.length;
  return {
    ok: matchedCount >= 2,
    providedCount: provided.length,
    matchedCount,
    missing,
  };
}
