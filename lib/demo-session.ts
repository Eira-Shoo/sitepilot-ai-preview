import type { WebsiteBlueprint } from "@/lib/validators/website-blueprint";
import { websiteBlueprintSchema } from "@/lib/validators/website-blueprint";

export const DEMO_BLUEPRINT_STORAGE_KEY = "sitepilot_demo_blueprint_v1";

export function saveDemoBlueprint(blueprint: WebsiteBlueprint) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DEMO_BLUEPRINT_STORAGE_KEY, JSON.stringify(blueprint));
  } catch {
    /* quota — preview still works in memory */
  }
}

export function loadDemoBlueprint(): WebsiteBlueprint | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(DEMO_BLUEPRINT_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = websiteBlueprintSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function clearDemoBlueprint() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DEMO_BLUEPRINT_STORAGE_KEY);
}
