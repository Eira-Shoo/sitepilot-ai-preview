const MAX_COERCE_DEPTH = 12;
export const MAX_BLUEPRINT_WALK_DEPTH = 20;

function assertWalkDepth(depth: number, label: string) {
  if (depth > MAX_BLUEPRINT_WALK_DEPTH) {
    throw new Error(`Blueprint processing exceeded max depth at ${label}`);
  }
}

/** Coerce LLM output (often nested or circular objects) into plain strings. */
export function coerceToString(
  value: unknown,
  fallback = "",
  seen?: WeakSet<object>,
  depth = 0,
): string {
  if (value == null) return fallback;
  if (depth > MAX_COERCE_DEPTH) return fallback;
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value
      .map((v) => coerceToString(v, "", seen, depth + 1))
      .filter(Boolean)
      .join(", ");
  }
  if (typeof value === "object") {
    const obj = value as object;
    const visited = seen ?? new WeakSet<object>();
    if (visited.has(obj)) return fallback;
    visited.add(obj);

    const o = value as Record<string, unknown>;
    const candidate =
      o.text ??
      o.label ??
      o.title ??
      o.name ??
      o.value ??
      o.headline ??
      o.description ??
      o.primary ??
      o.main ??
      o.content;
    if (candidate != null && candidate !== value) {
      return coerceToString(candidate, fallback, visited, depth + 1);
    }
  }
  return fallback;
}

export function coerceStringArray(value: unknown): string[] {
  if (value == null) return [];
  if (typeof value === "string") return value.trim() ? [value.trim()] : [];
  if (!Array.isArray(value)) return [coerceToString(value)].filter(Boolean);
  return value.map((v) => coerceToString(v)).filter(Boolean);
}

function normalizeLinkArray(links: unknown): { label: string; href: string }[] {
  if (!Array.isArray(links)) return [];
  return links.map((link) => {
    if (typeof link === "string") {
      const label = link.trim();
      const slug = label.toLowerCase().replace(/\s+/g, "-");
      return { label, href: slug.startsWith("#") ? slug : `#${slug}` };
    }
    if (link && typeof link === "object") {
      const o = link as Record<string, unknown>;
      return {
        label: coerceToString(o.label ?? o.text ?? o.name, "Link"),
        href: coerceToString(o.href ?? o.url ?? "#", "#"),
      };
    }
    return { label: coerceToString(link, "Link"), href: "#" };
  });
}

function normalizeServiceLikeItems(items: unknown): unknown[] {
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    if (typeof item === "string") return { name: item };
    if (!item || typeof item !== "object") return { name: coerceToString(item) };
    const o = { ...(item as Record<string, unknown>) };
    for (const key of [
      "name",
      "description",
      "price",
      "duration",
      "cta",
      "whoFor",
      "included",
      "imageUrl",
    ]) {
      if (key in o) o[key] = coerceToString(o[key]);
    }
    return o;
  });
}

function normalizeSection(section: unknown, depth = 0): unknown {
  assertWalkDepth(depth, "section");
  if (!section || typeof section !== "object") return section;
  const s = { ...(section as Record<string, unknown>) };
  const type = String(s.type ?? "");

  switch (type) {
    case "trust":
      s.items = coerceStringArray(s.items);
      s.headline = coerceToString(s.headline);
      break;
    case "contact":
      s.formFields = coerceStringArray(s.formFields);
      s.headline = coerceToString(s.headline);
      break;
    case "hero":
    case "cta":
    case "map":
    case "video":
    case "before_after":
      for (const key of Object.keys(s)) {
        if (key !== "type" && key !== "items" && key !== "links" && key !== "formFields") {
          s[key] = coerceToString(s[key]);
        }
      }
      break;
    case "services":
    case "pricing":
      s.items = normalizeServiceLikeItems(s.items);
      s.headline = coerceToString(s.headline);
      break;
    case "gallery":
      if (Array.isArray(s.items)) {
        s.items = s.items.map((item) => {
          if (!item || typeof item !== "object") return item;
          const g = { ...(item as Record<string, unknown>) };
          g.imagePrompt = coerceToString(g.imagePrompt);
          g.caption = coerceToString(g.caption);
          g.imageUrl = coerceToString(g.imageUrl);
          return g;
        });
      }
      break;
    case "faq":
      if (Array.isArray(s.items)) {
        s.items = s.items.map((item) => {
          if (!item || typeof item !== "object") return item;
          const f = item as Record<string, unknown>;
          return {
            question: coerceToString(f.question),
            answer: coerceToString(f.answer),
          };
        });
      }
      break;
    case "testimonials":
      if (Array.isArray(s.items)) {
        s.items = s.items.map((item) => {
          if (!item || typeof item !== "object") return item;
          const t = item as Record<string, unknown>;
          return {
            quote: coerceToString(t.quote),
            name: coerceToString(t.name),
            role: coerceToString(t.role),
          };
        });
      }
      break;
    case "process":
      if (Array.isArray(s.items)) {
        s.items = s.items.map((item) => {
          if (!item || typeof item !== "object") return item;
          const p = item as Record<string, unknown>;
          return {
            title: coerceToString(p.title),
            description: coerceToString(p.description),
          };
        });
      }
      break;
    case "navbar":
    case "footer":
      s.links = normalizeLinkArray(s.links);
      s.logoText = coerceToString(s.logoText);
      s.tagline = coerceToString(s.tagline);
      break;
    default:
      break;
  }
  return s;
}

function normalizeStringFields(
  obj: Record<string, unknown>,
  keys: string[],
): Record<string, unknown> {
  const out = { ...obj };
  for (const key of keys) {
    if (key in out) out[key] = coerceToString(out[key]);
  }
  return out;
}

function normalizeRecordValues(obj: unknown): Record<string, string> {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    out[k] = coerceToString(v);
  }
  return out;
}

function looksLikeMediaItem(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const o = value as Record<string, unknown>;
  return (
    "fileName" in o ||
    "assetType" in o ||
    "previewDataUrl" in o ||
    "placement" in o ||
    "altText" in o ||
    "id" in o
  );
}

function normalizeMediaItem(item: unknown): Record<string, unknown> {
  if (typeof item === "string") {
    return {
      id: "",
      fileName: item,
      previewDataUrl: "",
      assetType: "",
      placement: [],
      altText: "",
      useForAiDirection: false,
    };
  }
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    return {
      id: "",
      fileName: coerceToString(item),
      previewDataUrl: "",
      assetType: "",
      placement: [],
      altText: "",
      useForAiDirection: false,
    };
  }
  const o = { ...(item as Record<string, unknown>) };
  return {
    id: coerceToString(o.id),
    fileName: coerceToString(o.fileName ?? o.name),
    previewDataUrl: coerceToString(o.previewDataUrl ?? o.url ?? o.src),
    assetType: coerceToString(o.assetType ?? o.type),
    placement: coerceStringArray(o.placement),
    altText: coerceToString(o.altText ?? o.alt),
    useForAiDirection: Boolean(o.useForAiDirection),
  };
}

/** OpenAI often returns media as { assets: [...] } instead of a top-level array. */
function normalizeMediaArray(value: unknown): unknown[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value.map(normalizeMediaItem);

  if (typeof value !== "object") return [];

  const o = value as Record<string, unknown>;
  if (Array.isArray(o.assets)) return o.assets.map(normalizeMediaItem);
  if (Array.isArray(o.items)) return o.items.map(normalizeMediaItem);
  if (Array.isArray(o.media)) return o.media.map(normalizeMediaItem);
  if (looksLikeMediaItem(value)) return [normalizeMediaItem(value)];

  const values = Object.values(o);
  if (
    values.length > 0 &&
    values.every((v) => looksLikeMediaItem(v) || typeof v === "string")
  ) {
    return values.map(normalizeMediaItem);
  }

  return [];
}

/**
 * Fixes common OpenAI JSON shape mistakes before Zod validation.
 */
export function normalizeOpenAiBlueprintPayload(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const bp = { ...(raw as Record<string, unknown>) };

  if (bp.business && typeof bp.business === "object") {
    bp.business = normalizeStringFields(bp.business as Record<string, unknown>, [
      "name",
      "industry",
      "location",
      "language",
      "tone",
    ]);
  }

  if (bp.brand && typeof bp.brand === "object") {
    bp.brand = normalizeStringFields(bp.brand as Record<string, unknown>, [
      "primaryColor",
      "secondaryColor",
      "backgroundStyle",
      "fontStyle",
      "designStyle",
    ]);
  }

  if (bp.seo && typeof bp.seo === "object") {
    const seo = { ...(bp.seo as Record<string, unknown>) };
    seo.title = coerceToString(seo.title);
    seo.description = coerceToString(seo.description);
    seo.localSeoText = coerceToString(seo.localSeoText);
    seo.keywords = coerceStringArray(seo.keywords);
    bp.seo = seo;
  }

  if (bp.conversionPlan && typeof bp.conversionPlan === "object") {
    const plan = { ...(bp.conversionPlan as Record<string, unknown>) };
    plan.mainGoal = coerceToString(plan.mainGoal);
    plan.primaryCta = coerceToString(plan.primaryCta);
    plan.secondaryCta = coerceToString(plan.secondaryCta);
    plan.trackingEvents = coerceStringArray(plan.trackingEvents);
    bp.conversionPlan = plan;
  }

  if (bp.goals && typeof bp.goals === "object") {
    bp.goals = normalizeStringFields(bp.goals as Record<string, unknown>, [
      "primary",
      "primaryCta",
      "secondaryCta",
      "preferredContact",
    ]);
  }

  if (bp.targetAudience && typeof bp.targetAudience === "object") {
    const ta = { ...(bp.targetAudience as Record<string, unknown>) };
    ta.who = coerceToString(ta.who);
    ta.problems = coerceToString(ta.problems);
    ta.careAbout = coerceToString(ta.careAbout);
    ta.feelTags = coerceStringArray(ta.feelTags);
    bp.targetAudience = ta;
  }

  if (bp.trust && typeof bp.trust === "object") {
    const trust = { ...(bp.trust as Record<string, unknown>) };
    for (const key of [
      "yearsExperience",
      "certifications",
      "awards",
      "guarantees",
      "paymentMethods",
    ]) {
      if (key in trust) trust[key] = coerceToString(trust[key]);
    }
    if (trust.reviewPlatforms) {
      trust.reviewPlatforms = normalizeRecordValues(trust.reviewPlatforms);
    }
    bp.trust = trust;
  }

  if (bp.localBusiness && typeof bp.localBusiness === "object") {
    const lb = { ...(bp.localBusiness as Record<string, unknown>) };
    for (const key of [
      "address",
      "serviceArea",
      "phone",
      "email",
      "openingHours",
      "mapsLink",
      "placeId",
    ]) {
      if (key in lb) lb[key] = coerceToString(lb[key]);
    }
    bp.localBusiness = lb;
  }

  bp.improvementIdeas = coerceStringArray(bp.improvementIdeas);
  bp.extraFeatures = coerceStringArray(bp.extraFeatures);

  if (bp.media !== undefined) {
    bp.media = normalizeMediaArray(bp.media);
  }

  if (Array.isArray(bp.services)) {
    bp.services = normalizeServiceLikeItems(bp.services);
  } else if (bp.services && typeof bp.services === "object") {
    const svc = bp.services as Record<string, unknown>;
    if (Array.isArray(svc.items)) {
      bp.services = normalizeServiceLikeItems(svc.items);
    } else {
      const values = Object.values(svc);
      bp.services =
        values.length > 0 && values.every((v) => v && typeof v === "object")
          ? normalizeServiceLikeItems(values)
          : [];
    }
  }

  if (Array.isArray(bp.pages)) {
    bp.pages = bp.pages.map((page, pageIdx) => {
      assertWalkDepth(0, `pages[${pageIdx}]`);
      if (!page || typeof page !== "object") return page;
      const p = { ...(page as Record<string, unknown>) };
      p.slug = coerceToString(p.slug, "home");
      p.title = coerceToString(p.title);
      if (Array.isArray(p.sections)) {
        p.sections = p.sections.map((s) => normalizeSection(s, 1));
      }
      return p;
    });
  }

  return bp;
}
