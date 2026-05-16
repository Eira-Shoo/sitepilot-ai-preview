import type { WebsiteBlueprint } from "@/lib/validators/website-blueprint";

export const demoBlueprint: WebsiteBlueprint = {
  business: {
    name: "Northline Beauty Studio",
    industry: "Beauty & wellness",
    location: "Berlin, Germany",
    language: "en",
    tone: "warm and professional",
  },
  brand: {
    primaryColor: "#3b82f6",
    secondaryColor: "#8b5cf6",
    backgroundStyle: "soft gradient",
    fontStyle: "modern sans",
    designStyle: "premium minimal",
  },
  seo: {
    title: "Northline Beauty Studio — facials, brows & glow-ups",
    description:
      "Book expert facials, brow design, and skin treatments in Berlin. Calm studio, clear pricing, same-week availability.",
    keywords: ["beauty studio berlin", "facial", "brows", "skin care"],
    localSeoText:
      "Serving Berlin Mitte and nearby neighborhoods with walkable appointments and easy parking nearby.",
  },
  pages: [
    {
      slug: "home",
      title: "Home",
      sections: [
        {
          type: "hero",
          headline: "Glow with confidence — tailored treatments, calm studio",
          subheadline:
            "Facials, brows, and skin coaching designed for busy professionals who want visible results without the fluff.",
          primaryCta: "Book a consultation",
          secondaryCta: "View services",
          imagePrompt:
            "Minimal beauty studio interior, soft daylight, orchid accent, premium spa aesthetic",
        },
        {
          type: "trust",
          headline: "Why clients choose us",
          items: [
            "Certified estheticians",
            "Transparent pricing",
            "Hygiene-first protocols",
            "Personalized skin plans",
          ],
        },
        {
          type: "services",
          headline: "Signature services",
          items: [
            {
              name: "HydraGlow Facial",
              description: "Deep cleanse, exfoliation, hydration boost",
              price: "From €89",
              duration: "60 min",
              cta: "Book now",
            },
            {
              name: "Brow Architecture",
              description: "Mapping, shaping, and tint for a lifted look",
              price: "From €45",
              duration: "45 min",
              cta: "Reserve",
            },
          ],
        },
        {
          type: "map",
          headline: "Visit us",
          address: "Torstraße 1, 10119 Berlin",
          placeId: "",
        },
        {
          type: "faq",
          headline: "Common questions",
          items: [
            {
              question: "Do you offer first-time consultations?",
              answer:
                "Yes — we start with a quick skin goals chat and patch test if needed.",
            },
            {
              question: "What is your cancellation policy?",
              answer:
                "Free reschedule up to 24 hours before your appointment.",
            },
          ],
        },
        {
          type: "contact",
          headline: "Request a callback",
          formFields: ["name", "email", "phone", "message"],
        },
      ],
    },
  ],
  conversionPlan: {
    mainGoal: "Increase bookings",
    primaryCta: "Book a consultation",
    secondaryCta: "Call the studio",
    trackingEvents: ["cta_click", "form_submit", "phone_click"],
  },
  imagePrompts: [
    {
      section: "hero",
      prompt: "Calm spa reception with soft blue-violet gradient lighting",
      purpose: "Hero background",
      style: "Premium photography",
    },
    {
      section: "services",
      prompt: "Close-up of facial treatment, clean hands, premium products",
      purpose: "Services row",
      style: "Premium photography",
    },
  ],
  improvementIdeas: [
    "Add a short “starting at” pricing strip under the hero for clarity.",
    "Move FAQ above the map on mobile to reduce scroll fatigue.",
  ],
  goals: {
    primary: "Increase bookings",
    primaryCta: "Book a consultation",
    secondaryCta: "Call the studio",
    preferredContact: "Contact form",
  },
  targetAudience: {
    who: "",
    problems: "",
    careAbout: "",
    feelTags: [],
  },
  services: [],
  packages: { visibility: "", items: [] },
  media: [],
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
  },
  trust: {
    yearsExperience: "",
    certifications: "",
    awards: "",
    guarantees: "",
    paymentMethods: "",
    reviewPlatforms: {},
    hideEmptyReviews: true,
  },
  pagesPlan: { structure: "one-page", pages: ["Home", "Contact"] },
  extraFeatures: [],
};
