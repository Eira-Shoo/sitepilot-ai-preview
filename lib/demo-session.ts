import type { WebsiteBlueprint } from "@/lib/validators/website-blueprint";
import { websiteBlueprintSchema } from "@/lib/validators/website-blueprint";
import type { BlueprintGenerationSource } from "@/lib/openai/generate-website-blueprint";

/** @deprecated Legacy key — migrated to DEMO_DRAFT_STORAGE_KEY */
export const DEMO_BLUEPRINT_STORAGE_KEY = "sitepilot_demo_blueprint_v1";
export const DEMO_DRAFT_STORAGE_KEY = "sitepilot_demo_draft_v2";

export type DemoDraftBundle = {
  blueprint: WebsiteBlueprint;
  source: BlueprintGenerationSource;
  savedAt: string;
};

function parseDraft(raw: string): DemoDraftBundle | null {
  try {
    const data = JSON.parse(raw) as unknown;
    if (data && typeof data === "object" && "blueprint" in data) {
      const bundle = data as DemoDraftBundle;
      const parsed = websiteBlueprintSchema.safeParse(bundle.blueprint);
      if (!parsed.success) return null;
      const source = bundle.source === "openai" ? "openai" : "mock";
      return { blueprint: parsed.data, source, savedAt: bundle.savedAt ?? "" };
    }
    const legacy = websiteBlueprintSchema.safeParse(data);
    if (legacy.success) {
      return { blueprint: legacy.data, source: "mock", savedAt: "" };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function saveDemoDraft(blueprint: WebsiteBlueprint, source: BlueprintGenerationSource) {
  if (typeof window === "undefined") return;
  const bundle: DemoDraftBundle = {
    blueprint,
    source,
    savedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(DEMO_DRAFT_STORAGE_KEY, JSON.stringify(bundle));
    localStorage.removeItem(DEMO_BLUEPRINT_STORAGE_KEY);
  } catch {
    /* quota */
  }
}

/** @deprecated Use saveDemoDraft */
export function saveDemoBlueprint(blueprint: WebsiteBlueprint) {
  saveDemoDraft(blueprint, "mock");
}

export function loadDemoDraft(): DemoDraftBundle | null {
  if (typeof window === "undefined") return null;

  const v2 = localStorage.getItem(DEMO_DRAFT_STORAGE_KEY);
  if (v2) {
    const draft = parseDraft(v2);
    if (draft) return draft;
  }

  const legacy = localStorage.getItem(DEMO_BLUEPRINT_STORAGE_KEY);
  if (legacy) {
    const draft = parseDraft(legacy);
    if (draft) {
      saveDemoDraft(draft.blueprint, draft.source);
      return draft;
    }
  }
  return null;
}

export function loadDemoBlueprint(): WebsiteBlueprint | null {
  return loadDemoDraft()?.blueprint ?? null;
}

export function loadDemoGenerationSource(): BlueprintGenerationSource | null {
  return loadDemoDraft()?.source ?? null;
}

export function clearDemoBlueprint() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DEMO_DRAFT_STORAGE_KEY);
  localStorage.removeItem(DEMO_BLUEPRINT_STORAGE_KEY);
}
