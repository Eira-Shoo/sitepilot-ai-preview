/**
 * POST Apex Barber onboarding to local generate API. Run while dev server is up.
 * node scripts/test-apex-generate.mjs
 */
const onboarding = {
  basics: {
    businessName: "Apex Barber Studio",
    industry: "Barber / Men's grooming",
    businessType: "Local business",
    description: "Premium barber studio in Hamburg.",
    country: "Germany",
    city: "Hamburg",
    language: "en",
    websiteUrl: "",
    social: { instagram: "", tiktok: "", youtube: "", facebook: "", linkedin: "" },
  },
  mainGoal: {
    primary: "Get more bookings",
    primaryCta: "Book an appointment",
    secondaryCta: "View services",
    preferredContact: "Booking link",
  },
  targetAudience: {
    who: "Men aged 18–45 who want premium haircuts and beard grooming",
    problems: "",
    careAbout: "",
    feelTags: [],
  },
  offers: {
    services: [
      {
        name: "Premium Haircut",
        description: "Precision haircut, styling and consultation.",
        startingPrice: "35 €",
        duration: "45 min",
        whoFor: "",
        included: "",
        cta: "Book now",
      },
      {
        name: "Beard Trim",
        description: "Clean beard shape, trimming and grooming.",
        startingPrice: "20 €",
        duration: "25 min",
        whoFor: "",
        included: "",
        cta: "Book now",
      },
      {
        name: "Haircut + Beard",
        description: "Full haircut and beard grooming package.",
        startingPrice: "50 €",
        duration: "60 min",
        whoFor: "",
        included: "",
        cta: "Book now",
      },
    ],
  },
  packages: { visibility: "Yes, show starting prices", items: [] },
  branding: {
    preferredWebsiteStyle: ["Premium", "Dark", "Local/trustworthy"],
    websiteMood: ["Trustworthy", "Premium"],
    colorsPreferred: "black, gold, white",
    colorsAvoid: "",
    fontStyle: "Modern",
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
    serviceArea: "Hamburg",
    phone: "",
    email: "",
    openingHours: "",
    mapsLink: "",
    placeId: "",
    showMap: true,
    showHours: true,
    showLocalTrust: true,
    placeQuery: "",
  },
  trust: {
    yearsExperience: "5 years experience",
    certifications: "",
    awards: "",
    guarantees: "Clean studio\nEasy online booking\nPremium grooming",
    paymentMethods: "",
    reviewPlatforms: { google: "", trustpilot: "", provenExpert: "", yelp: "", other: "" },
    hideEmptyReviews: true,
    testimonials: [],
  },
  sitePages: { structure: "one-page", pages: ["Home", "Services", "Contact", "FAQ"] },
  seo: {
    mainKeyword: "barber hamburg",
    secondaryKeywords: "men's haircut hamburg, beard trim hamburg",
    regionKeywords: "",
    searchIntent: "",
    competitors: "",
    metaTitleHint: "",
    metaDescriptionHint: "",
  },
  extraFeatures: [
    "Contact form",
    "Booking button",
    "Google Maps",
    "FAQ",
    "Gallery",
    "Pricing cards",
    "Trust badges",
    "Sticky mobile CTA",
  ],
};

const port = process.env.PORT ?? "3001";
const url = `http://localhost:${port}/api/ai/generate-website`;

console.log("POST", url);
const res = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ onboarding }),
});

const text = await res.text();
console.log("HTTP", res.status);
try {
  const json = JSON.parse(text);
  console.log("ok:", json.ok, "source:", json.source, "error:", json.error);
  if (json.details) console.log("details:", json.details);
  if (json.message) console.log("message:", json.message);
} catch {
  console.log(text.slice(0, 500));
}
