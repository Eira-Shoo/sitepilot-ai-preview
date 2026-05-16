import { z } from "zod";

const serviceItemSchema = z.object({
  name: z.string().optional().default(""),
  description: z.string().optional().default(""),
  price: z.string().optional().default(""),
  duration: z.string().optional().default(""),
  cta: z.string().optional().default(""),
  whoFor: z.string().optional().default(""),
  included: z.string().optional().default(""),
  imageUrl: z.string().optional().default(""),
});

const faqItemSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

const testimonialItemSchema = z.object({
  quote: z.string().optional().default(""),
  name: z.string().optional().default(""),
  role: z.string().optional().default(""),
});

const galleryItemSchema = z.object({
  imagePrompt: z.string().optional().default(""),
  caption: z.string().optional().default(""),
  imageUrl: z.string().optional().default(""),
});

function normalizeServiceItems(
  items: unknown,
): z.infer<typeof serviceItemSchema>[] {
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    if (typeof item === "string") {
      return {
        name: item,
        description: "",
        price: "",
        duration: "",
        cta: "",
        whoFor: "",
        included: "",
        imageUrl: "",
      };
    }
    const parsed = serviceItemSchema.safeParse(item);
    return parsed.success
      ? parsed.data
      : {
          name: "",
          description: "",
          price: "",
          duration: "",
          cta: "",
          whoFor: "",
          included: "",
          imageUrl: "",
        };
  });
}

function normalizeGalleryItems(items: unknown): z.infer<typeof galleryItemSchema>[] {
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    const parsed = galleryItemSchema.safeParse(item);
    return parsed.success
      ? parsed.data
      : { imagePrompt: "", caption: "", imageUrl: "" };
  });
}

const heroSectionSchema = z.object({
  type: z.literal("hero"),
  headline: z.string().optional().default(""),
  subheadline: z.string().optional().default(""),
  primaryCta: z.string().optional().default(""),
  secondaryCta: z.string().optional().default(""),
  imagePrompt: z.string().optional().default(""),
  imageUrl: z.string().optional().default(""),
});

const servicesSectionSchema = z
  .object({
    type: z.literal("services"),
    headline: z.string().optional().default(""),
    items: z.array(z.unknown()).optional().default([]),
  })
  .transform((s) => ({
    ...s,
    items: normalizeServiceItems(s.items),
  }));

const trustSectionSchema = z.object({
  type: z.literal("trust"),
  headline: z.string().optional().default(""),
  items: z.array(z.string()).optional().default([]),
});

const testimonialsSectionSchema = z.object({
  type: z.literal("testimonials"),
  headline: z.string().optional().default(""),
  items: z.array(testimonialItemSchema).optional().default([]),
});

const faqSectionSchema = z.object({
  type: z.literal("faq"),
  headline: z.string().optional().default(""),
  items: z.array(faqItemSchema).optional().default([]),
});

const contactSectionSchema = z.object({
  type: z.literal("contact"),
  headline: z.string().optional().default(""),
  formFields: z.array(z.string()).optional().default([]),
});

const mapSectionSchema = z.object({
  type: z.literal("map"),
  headline: z.string().optional().default(""),
  address: z.string().optional().default(""),
  placeId: z.string().optional().default(""),
});

const pricingSectionSchema = z
  .object({
    type: z.literal("pricing"),
    headline: z.string().optional().default(""),
    items: z.array(z.unknown()).optional().default([]),
  })
  .transform((s) => ({
    ...s,
    items: normalizeServiceItems(s.items),
  }));

const gallerySectionSchema = z
  .object({
    type: z.literal("gallery"),
    headline: z.string().optional().default(""),
    items: z.array(z.unknown()).optional().default([]),
  })
  .transform((s) => ({
    ...s,
    items: normalizeGalleryItems(s.items),
  }));

const beforeAfterSectionSchema = z.object({
  type: z.literal("before_after"),
  headline: z.string().optional().default(""),
  beforeCaption: z.string().optional().default(""),
  afterCaption: z.string().optional().default(""),
  beforeImagePrompt: z.string().optional().default(""),
  afterImagePrompt: z.string().optional().default(""),
});

const processSectionSchema = z.object({
  type: z.literal("process"),
  headline: z.string().optional().default(""),
  items: z
    .array(
      z.object({
        title: z.string().optional().default(""),
        description: z.string().optional().default(""),
      }),
    )
    .optional()
    .default([]),
});

const ctaSectionSchema = z.object({
  type: z.literal("cta"),
  headline: z.string().optional().default(""),
  body: z.string().optional().default(""),
  primaryCta: z.string().optional().default(""),
  secondaryCta: z.string().optional().default(""),
  imageUrl: z.string().optional().default(""),
});

const videoSectionSchema = z.object({
  type: z.literal("video"),
  headline: z.string().optional().default(""),
  videoUrl: z.string().optional().default(""),
  description: z.string().optional().default(""),
});

const footerSectionSchema = z.object({
  type: z.literal("footer"),
  tagline: z.string().optional().default(""),
  links: z
    .array(
      z.object({
        label: z.string(),
        href: z.string(),
      }),
    )
    .optional()
    .default([]),
});

const navbarSectionSchema = z.object({
  type: z.literal("navbar"),
  logoText: z.string().optional().default(""),
  logoUrl: z.string().optional().default(""),
  links: z
    .array(
      z.object({
        label: z.string(),
        href: z.string(),
      }),
    )
    .optional()
    .default([]),
});

const passthroughSection = z
  .object({ type: z.string() })
  .passthrough()
  .transform(
    (raw): z.infer<typeof ctaSectionSchema> => ({
      type: "cta",
      headline: String((raw as { headline?: string }).headline ?? "Section"),
      body: "",
      primaryCta: String((raw as { primaryCta?: string }).primaryCta ?? ""),
      secondaryCta: "",
      imageUrl: "",
    }),
  );

function parseSection(raw: unknown) {
  const obj = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
  const type = String(obj.type ?? "");
  const parsers: Record<string, z.ZodType> = {
    hero: heroSectionSchema,
    services: servicesSectionSchema,
    trust: trustSectionSchema,
    testimonials: testimonialsSectionSchema,
    faq: faqSectionSchema,
    contact: contactSectionSchema,
    map: mapSectionSchema,
    pricing: pricingSectionSchema,
    gallery: gallerySectionSchema,
    before_after: beforeAfterSectionSchema,
    process: processSectionSchema,
    cta: ctaSectionSchema,
    video: videoSectionSchema,
    footer: footerSectionSchema,
    navbar: navbarSectionSchema,
  };
  const parser = parsers[type];
  if (parser) {
    const r = parser.safeParse({ ...obj, type });
    if (r.success) return r.data;
  }
  return passthroughSection.parse({ ...obj, type: type || "unknown" });
}

const pageSchema = z.object({
  slug: z.string(),
  title: z.string().optional().default(""),
  sections: z.array(z.unknown()).transform((sections) => sections.map(parseSection)),
});

const imagePromptObjectSchema = z.object({
  section: z.string().optional().default(""),
  prompt: z.string(),
  purpose: z.string().optional().default(""),
  style: z.string().optional().default(""),
});

const goalsSchema = z.object({
  primary: z.string().optional().default(""),
  primaryCta: z.string().optional().default(""),
  secondaryCta: z.string().optional().default(""),
  preferredContact: z.string().optional().default(""),
});

const targetAudienceSchema = z.object({
  who: z.string().optional().default(""),
  problems: z.string().optional().default(""),
  careAbout: z.string().optional().default(""),
  feelTags: z.array(z.string()).optional().default([]),
});

const mediaItemSchema = z.object({
  id: z.string().optional().default(""),
  fileName: z.string().optional().default(""),
  previewDataUrl: z.string().optional().default(""),
  assetType: z.string().optional().default(""),
  placement: z.array(z.string()).optional().default([]),
  altText: z.string().optional().default(""),
  useForAiDirection: z.boolean().optional().default(false),
});

const packagesMetaSchema = z.object({
  visibility: z.string().optional().default(""),
  items: z.array(z.record(z.string(), z.unknown())).optional().default([]),
});

const trustMetaSchema = z.object({
  yearsExperience: z.string().optional().default(""),
  certifications: z.string().optional().default(""),
  awards: z.string().optional().default(""),
  guarantees: z.string().optional().default(""),
  paymentMethods: z.string().optional().default(""),
  reviewPlatforms: z.record(z.string(), z.string()).optional().default({}),
  hideEmptyReviews: z.boolean().optional().default(true),
});

const localBusinessMetaSchema = z.object({
  address: z.string().optional().default(""),
  serviceArea: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  email: z.string().optional().default(""),
  openingHours: z.string().optional().default(""),
  mapsLink: z.string().optional().default(""),
  placeId: z.string().optional().default(""),
  showMap: z.boolean().optional().default(true),
  showHours: z.boolean().optional().default(true),
  showLocalTrust: z.boolean().optional().default(true),
});

const sitePagesPlanSchema = z.object({
  structure: z.string().optional().default("one-page"),
  pages: z.array(z.string()).optional().default([]),
});

export const websiteBlueprintSchema = z.object({
  business: z.object({
    name: z.string().optional().default(""),
    industry: z.string().optional().default(""),
    location: z.string().optional().default(""),
    language: z.string().optional().default("en"),
    tone: z.string().optional().default("professional"),
  }),
  brand: z.object({
    primaryColor: z.string().optional().default("#3b82f6"),
    secondaryColor: z.string().optional().default("#8b5cf6"),
    backgroundStyle: z.string().optional().default(""),
    fontStyle: z.string().optional().default(""),
    designStyle: z.string().optional().default(""),
  }),
  seo: z.object({
    title: z.string().optional().default(""),
    description: z.string().optional().default(""),
    keywords: z.array(z.string()).optional().default([]),
    localSeoText: z.string().optional().default(""),
  }),
  pages: z.array(pageSchema).min(1),
  conversionPlan: z.object({
    mainGoal: z.string().optional().default(""),
    primaryCta: z.string().optional().default(""),
    secondaryCta: z.string().optional().default(""),
    trackingEvents: z.array(z.string()).optional().default([]),
  }),
  imagePrompts: z
    .array(z.union([z.string(), imagePromptObjectSchema]))
    .optional()
    .default([])
    .transform((arr) =>
      arr.map((item) =>
        typeof item === "string"
          ? { section: "", prompt: item, purpose: "", style: "" }
          : {
              section: item.section ?? "",
              prompt: item.prompt,
              purpose: item.purpose ?? "",
              style: item.style ?? "",
            },
      ),
    ),
  improvementIdeas: z.array(z.string()).optional().default([]),
  goals: goalsSchema.optional().default({
    primary: "",
    primaryCta: "",
    secondaryCta: "",
    preferredContact: "",
  }),
  targetAudience: targetAudienceSchema.optional().default({
    who: "",
    problems: "",
    careAbout: "",
    feelTags: [],
  }),
  services: z.array(z.record(z.string(), z.unknown())).optional().default([]),
  packages: packagesMetaSchema.optional().default({ visibility: "", items: [] }),
  media: z.array(mediaItemSchema).optional().default([]),
  localBusiness: localBusinessMetaSchema.optional().default({
    address: "",
    serviceArea: "",
    phone: "",
    email: "",
    openingHours: "",
    mapsLink: "",
    placeId: "",
    showMap: true,
    showHours: true,
    showLocalTrust: true,
  }),
  trust: trustMetaSchema.optional().default({
    yearsExperience: "",
    certifications: "",
    awards: "",
    guarantees: "",
    paymentMethods: "",
    reviewPlatforms: {},
    hideEmptyReviews: true,
  }),
  /** Requested site structure from intake (not the rendered routing model). */
  pagesPlan: sitePagesPlanSchema.optional().default({ structure: "one-page", pages: [] }),
  extraFeatures: z.array(z.string()).optional().default([]),
});

export type WebsiteBlueprint = z.infer<typeof websiteBlueprintSchema>;
export type BlueprintSection = WebsiteBlueprint["pages"][number]["sections"][number];

export function parseWebsiteBlueprint(data: unknown): WebsiteBlueprint {
  return websiteBlueprintSchema.parse(data);
}

export function safeParseWebsiteBlueprint(data: unknown) {
  return websiteBlueprintSchema.safeParse(data);
}
