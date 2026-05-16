import { z } from "zod";

const socialSchema = z.object({
  instagram: z.string().optional().default(""),
  tiktok: z.string().optional().default(""),
  youtube: z.string().optional().default(""),
  facebook: z.string().optional().default(""),
  linkedin: z.string().optional().default(""),
});

const mediaAssetSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  /** Base64 data URL or remote URL — used only in preview; not persisted server-side in demo */
  previewDataUrl: z.string().optional().default(""),
  assetType: z.string().optional().default("other"),
  placement: z.array(z.string()).optional().default([]),
  altText: z.string().optional().default(""),
  useForAiDirection: z.boolean().optional().default(false),
});

const serviceCardSchema = z.object({
  name: z.string().optional().default(""),
  description: z.string().optional().default(""),
  startingPrice: z.string().optional().default(""),
  duration: z.string().optional().default(""),
  whoFor: z.string().optional().default(""),
  included: z.string().optional().default(""),
  cta: z.string().optional().default(""),
});

const packageCardSchema = z.object({
  name: z.string().optional().default(""),
  price: z.string().optional().default(""),
  billing: z.string().optional().default("one-time"),
  features: z.string().optional().default(""),
  recommended: z.boolean().optional().default(false),
});

const testimonialSchema = z.object({
  name: z.string().optional().default(""),
  role: z.string().optional().default(""),
  text: z.string().optional().default(""),
  rating: z.string().optional().default(""),
});

export const onboardingSchema = z.object({
  basics: z.object({
    businessName: z.string().min(1),
    industry: z.string().min(1),
    businessType: z.string().optional().default("Local business"),
    description: z.string().optional().default(""),
    country: z.string().optional().default(""),
    city: z.string().optional().default(""),
    language: z.string().optional().default("en"),
    websiteUrl: z.string().optional().default(""),
    social: socialSchema.optional().default({
      instagram: "",
      tiktok: "",
      youtube: "",
      facebook: "",
      linkedin: "",
    }),
  }),
  mainGoal: z.object({
    primary: z.string().min(1),
    primaryCta: z.string().optional().default(""),
    secondaryCta: z.string().optional().default(""),
    preferredContact: z.string().optional().default("Contact form"),
  }),
  targetAudience: z.object({
    who: z.string().optional().default(""),
    problems: z.string().optional().default(""),
    careAbout: z.string().optional().default(""),
    feelTags: z.array(z.string()).optional().default([]),
  }),
  offers: z.object({
    services: z.array(serviceCardSchema).optional().default([]),
  }),
  packages: z.object({
    visibility: z.string().optional().default("Not sure, let AI suggest"),
    items: z.array(packageCardSchema).optional().default([]),
  }),
  branding: z.object({
    websiteStyle: z.string().optional().default("Modern SaaS"),
    colorsPreferred: z.string().optional().default(""),
    colorsAvoid: z.string().optional().default(""),
    fontStyle: z.string().optional().default("Modern"),
    mood: z.string().optional().default("Trustworthy"),
    inspirationUrls: z.string().optional().default(""),
    notes: z.string().optional().default(""),
  }),
  media: z.object({
    assets: z.array(mediaAssetSchema).optional().default([]),
  }),
  imageDirection: z.object({
    generatePrompts: z.boolean().optional().default(true),
    preferredStyle: z.string().optional().default("Premium photography"),
    avoid: z.string().optional().default(""),
    requiredSubjects: z.string().optional().default(""),
  }),
  localBusiness: z.object({
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
    placeQuery: z.string().optional().default(""),
    /** Filled only when Google Places API enrichment runs (non-demo). */
    placeDetails: z.unknown().optional(),
  }),
  trust: z.object({
    yearsExperience: z.string().optional().default(""),
    certifications: z.string().optional().default(""),
    awards: z.string().optional().default(""),
    guarantees: z.string().optional().default(""),
    paymentMethods: z.string().optional().default(""),
    reviewPlatforms: z.object({
      google: z.string().optional().default(""),
      trustpilot: z.string().optional().default(""),
      provenExpert: z.string().optional().default(""),
      yelp: z.string().optional().default(""),
      other: z.string().optional().default(""),
    }),
    hideEmptyReviews: z.boolean().optional().default(true),
    testimonials: z.array(testimonialSchema).optional().default([]),
  }),
  sitePages: z.object({
    structure: z.enum(["one-page", "multi-page"]).optional().default("one-page"),
    pages: z.array(z.string()).optional().default(["Home", "Contact"]),
  }),
  seo: z.object({
    mainKeyword: z.string().optional().default(""),
    secondaryKeywords: z.string().optional().default(""),
    regionKeywords: z.string().optional().default(""),
    searchIntent: z.string().optional().default(""),
    competitors: z.string().optional().default(""),
    metaTitleHint: z.string().optional().default(""),
    metaDescriptionHint: z.string().optional().default(""),
  }),
  extraFeatures: z.array(z.string()).optional().default([]),
});

export type OnboardingPayload = z.infer<typeof onboardingSchema>;

export function defaultOnboardingPayload(): OnboardingPayload {
  return {
    basics: {
      businessName: "",
      industry: "",
      businessType: "Local business",
      description: "",
      country: "",
      city: "",
      language: "en",
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
      primary: "Collect leads",
      primaryCta: "Get in touch",
      secondaryCta: "View services",
      preferredContact: "Contact form",
    },
    targetAudience: {
      who: "",
      problems: "",
      careAbout: "",
      feelTags: [],
    },
    offers: {
      services: [
        {
          name: "",
          description: "",
          startingPrice: "",
          duration: "",
          whoFor: "",
          included: "",
          cta: "Learn more",
        },
      ],
    },
    packages: {
      visibility: "Not sure, let AI suggest",
      items: [],
    },
    branding: {
      websiteStyle: "Modern SaaS",
      colorsPreferred: "",
      colorsAvoid: "",
      fontStyle: "Modern",
      mood: "Trustworthy",
      inspirationUrls: "",
      notes: "",
    },
    media: { assets: [] },
    imageDirection: {
      generatePrompts: true,
      preferredStyle: "Premium photography",
      avoid: "",
      requiredSubjects: "",
    },
    localBusiness: {
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
      placeQuery: "",
      placeDetails: undefined,
    },
    trust: {
      yearsExperience: "",
      certifications: "",
      awards: "",
      guarantees: "",
      paymentMethods: "",
      reviewPlatforms: {
        google: "",
        trustpilot: "",
        provenExpert: "",
        yelp: "",
        other: "",
      },
      hideEmptyReviews: true,
      testimonials: [],
    },
    sitePages: {
      structure: "one-page",
      pages: ["Home", "Services", "Contact", "FAQ"],
    },
    seo: {
      mainKeyword: "",
      secondaryKeywords: "",
      regionKeywords: "",
      searchIntent: "",
      competitors: "",
      metaTitleHint: "",
      metaDescriptionHint: "",
    },
    extraFeatures: [
      "Contact form",
      "FAQ",
      "Google Maps",
      "Pricing cards",
      "Testimonials",
    ],
  };
}
