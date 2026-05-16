import type { OnboardingPayload } from "@/lib/validators/onboarding";
import type { WebsiteBlueprint } from "@/lib/validators/website-blueprint";
import { parseWebsiteBlueprint } from "@/lib/validators/website-blueprint";

function hasFeature(extra: string[], label: string) {
  return extra.some((e) => e.toLowerCase() === label.toLowerCase());
}

function inferColors(style: string, preferred: string) {
  const combined = `${style} ${preferred}`.toLowerCase();
  const p = preferred.toLowerCase();
  if (p.includes("#")) {
    const m = p.match(/#[0-9a-fA-F]{3,8}/g);
    if (m?.length) {
      return { primary: m[0], secondary: m[1] ?? "#8b5cf6" };
    }
  }
  if (
    combined.includes("gold") &&
    (combined.includes("black") || combined.includes("dark") || combined.includes("white"))
  ) {
    return { primary: "#0a0a0a", secondary: "#c9a227" };
  }
  if (style.toLowerCase().includes("luxury") || style.toLowerCase().includes("premium")) {
    return { primary: "#0f172a", secondary: "#c4a962" };
  }
  if (style.toLowerCase().includes("dark")) {
    return { primary: "#38bdf8", secondary: "#a78bfa" };
  }
  return { primary: "#3b82f6", secondary: "#8b5cf6" };
}

export function buildWebsiteBlueprintFromOnboarding(o: OnboardingPayload): WebsiteBlueprint {
  const name = o.basics.businessName.trim() || "Your business";
  const loc = [o.basics.city?.trim(), o.basics.country?.trim()].filter(Boolean).join(", ");
  const { primary, secondary } = inferColors(o.branding.websiteStyle, o.branding.colorsPreferred);

  const extra = o.extraFeatures ?? [];
  const showPricing =
    hasFeature(extra, "Pricing cards") &&
    !o.packages.visibility.startsWith("No, ask users");

  const logoAsset = o.media.assets.find(
    (a) => a.assetType?.toLowerCase() === "logo" && a.previewDataUrl,
  );
  const heroAsset =
    o.media.assets.find(
      (a) =>
        a.previewDataUrl &&
        (a.assetType?.toLowerCase() === "hero" ||
          a.placement.some((p) => p.toLowerCase().includes("hero"))),
    ) ?? o.media.assets.find((a) => a.placement.some((p) => p.toLowerCase().includes("hero")));

  const galleryAssets = o.media.assets.filter(
    (a) =>
      a.previewDataUrl &&
      (a.assetType?.toLowerCase() === "gallery" ||
        a.placement.some((p) => p.toLowerCase().includes("gallery"))),
  );

  const teamAsset = o.media.assets.find(
    (a) =>
      a.previewDataUrl &&
      (a.assetType?.toLowerCase() === "team" ||
        a.placement.some((p) => p.toLowerCase().includes("about"))),
  );

  const videoAsset = o.media.assets.find((a) => a.assetType?.toLowerCase() === "video");

  const productAssets = o.media.assets.filter(
    (a) =>
      a.previewDataUrl &&
      (a.assetType?.toLowerCase() === "product" ||
        a.placement.some((p) => p.toLowerCase().includes("services"))),
  );

  const servicesItems = (o.offers.services ?? [])
    .filter((s) => s.name?.trim() || s.description?.trim())
    .map((s, i) => {
      const img = productAssets[i]?.previewDataUrl ?? "";
      const descParts = [s.description?.trim(), s.whoFor ? `For: ${s.whoFor}` : "", s.included ? `Includes: ${s.included}` : ""].filter(
        Boolean,
      );
      return {
        name: s.name?.trim() || `Service ${i + 1}`,
        description: descParts.join("\n\n") || "Details coming soon.",
        price: s.startingPrice?.trim() ?? "",
        duration: s.duration?.trim() ?? "",
        cta: s.cta?.trim() || "Learn more",
        whoFor: s.whoFor?.trim() ?? "",
        included: s.included?.trim() ?? "",
        imageUrl: img,
      };
    });

  if (!servicesItems.length) {
    servicesItems.push({
      name: "Signature offering",
      description: o.basics.description?.trim() || "Tell us more and we will expand this block.",
      price: "",
      duration: "",
      cta: o.mainGoal.primaryCta || "Get in touch",
      whoFor: "",
      included: "",
      imageUrl: "",
    });
  }

  const trustItems: string[] = [];
  if (o.trust.yearsExperience) trustItems.push(`${o.trust.yearsExperience} years experience`);
  if (o.trust.certifications) trustItems.push(`Certifications: ${o.trust.certifications}`);
  if (o.trust.awards) trustItems.push(`Awards: ${o.trust.awards}`);
  if (o.trust.guarantees) trustItems.push(`Guarantees: ${o.trust.guarantees}`);
  if (o.trust.paymentMethods) trustItems.push(`Payments: ${o.trust.paymentMethods}`);
  if (o.localBusiness.showLocalTrust && o.basics.businessType) {
    trustItems.push(`Serving ${o.basics.businessType.toLowerCase()} clients`);
  }

  const testimonialRows = (o.trust.testimonials ?? []).filter((t) => t.text?.trim());
  const testimonialItems = testimonialRows.map((t) => ({
    quote: t.text!.trim(),
    name: t.name?.trim() ?? "",
    role: t.role?.trim() ?? "",
  }));

  const faqPairs: { question: string; answer: string }[] = [];
  if (hasFeature(extra, "FAQ")) {
    faqPairs.push(
      {
        question: "How do I get started?",
        answer: `Use the ${o.mainGoal.preferredContact.toLowerCase()} option on this page — we structured the site around that goal.`,
      },
      {
        question: "Where are you located?",
        answer: o.localBusiness.address?.trim()
          ? `We are based at ${o.localBusiness.address.trim()}${o.localBusiness.serviceArea ? ` and serve ${o.localBusiness.serviceArea}.` : "."}`
          : o.localBusiness.serviceArea
            ? `We serve ${o.localBusiness.serviceArea}.`
            : "Contact us for service area details.",
      },
    );
  }

  const mapAddress = o.localBusiness.address?.trim() || loc || "";

  const galleryItems =
    galleryAssets.length > 0
      ? galleryAssets.map((g) => ({
          imagePrompt: g.altText || g.fileName || "Gallery image",
          caption: g.altText || "",
          imageUrl: g.previewDataUrl ?? "",
        }))
      : o.imageDirection.generatePrompts
        ? [
            {
              imagePrompt: `Gallery collage: ${o.basics.industry} work in ${o.basics.city || "your area"} — ${o.imageDirection.preferredStyle}`,
              caption: "Suggested imagery",
              imageUrl: "",
            },
          ]
        : [];

  const heroImageUrl = heroAsset?.previewDataUrl?.trim() ?? "";
  const heroPrompt =
    !heroImageUrl && o.imageDirection.generatePrompts
      ? `${o.imageDirection.requiredSubjects || o.basics.industry} — ${o.imageDirection.preferredStyle}. ${o.imageDirection.avoid ? `Avoid: ${o.imageDirection.avoid}.` : ""}`.trim()
      : heroAsset?.altText || "";

  const pricingItems =
    showPricing && o.packages.items?.length
      ? o.packages.items
          .filter((p) => p.name?.trim())
          .map((p) => ({
            name: p.name!.trim(),
            description: (p.features || "").trim() || `${p.billing} billing`,
            price: p.price?.trim() || "See details",
            duration: "",
            cta: o.mainGoal.primaryCta || "Choose plan",
            whoFor: "",
            included: p.features?.trim() ?? "",
            imageUrl: "",
          }))
      : [];

  const navLinks: { label: string; href: string }[] = [{ label: "Home", href: "#top" }];
  if (servicesItems.length) navLinks.push({ label: "Services", href: "#services" });
  if (showPricing && pricingItems.length) navLinks.push({ label: "Pricing", href: "#pricing" });
  if (hasFeature(extra, "FAQ")) navLinks.push({ label: "FAQ", href: "#faq" });
  navLinks.push({ label: "Contact", href: "#contact" });

  if (hasFeature(extra, "Social media links")) {
    const s = o.basics.social;
    if (s?.instagram) navLinks.push({ label: "Instagram", href: s.instagram });
    if (s?.linkedin) navLinks.push({ label: "LinkedIn", href: s.linkedin });
  }

  const sections: WebsiteBlueprint["pages"][number]["sections"] = [];

  sections.push({
    type: "navbar",
    logoText: name,
    logoUrl: logoAsset?.previewDataUrl?.trim() ?? "",
    links: navLinks,
  });

  sections.push({
    type: "hero",
    headline: `${name} — ${o.mainGoal.primary}`,
    subheadline:
      o.basics.description?.trim() ||
      o.targetAudience.who?.trim() ||
      `Built for ${o.basics.industry.toLowerCase()} — ${o.mainGoal.primary.toLowerCase()}.`,
    primaryCta: o.mainGoal.primaryCta?.trim() || "Get started",
    secondaryCta: o.mainGoal.secondaryCta?.trim() || "",
    imagePrompt: heroPrompt,
    imageUrl: heroImageUrl,
  });

  if (trustItems.length && (o.localBusiness.showLocalTrust || trustItems.length >= 2)) {
    sections.push({
      type: "trust",
      headline: "Why choose us",
      items: trustItems.slice(0, 8),
    });
  }

  sections.push({
    type: "services",
    headline: `What we offer`,
    items: servicesItems,
  });

  if (showPricing && pricingItems.length) {
    sections.push({
      type: "pricing",
      headline: "Plans & pricing",
      items: pricingItems,
    });
  }

  if (hasFeature(extra, "Before/after section")) {
    sections.push({
      type: "before_after",
      headline: "Results",
      beforeCaption: "Before",
      afterCaption: "After",
      beforeImagePrompt: "Before state — neutral documentation style",
      afterImagePrompt: "After state — clear improvement",
    });
  }

  if (hasFeature(extra, "Gallery") && galleryItems.length) {
    sections.push({
      type: "gallery",
      headline: "Gallery",
      items: galleryItems,
    });
  }

  if (hasFeature(extra, "Testimonials")) {
    const hasReal = testimonialItems.length > 0;
    if (hasReal || !o.trust.hideEmptyReviews) {
      sections.push({
        type: "testimonials",
        headline: "Client stories",
        items: testimonialItems,
      });
    }
  }

  if (teamAsset?.previewDataUrl) {
    sections.push({
      type: "cta",
      headline: "Meet the team",
      body: teamAsset.altText || "The people behind the work.",
      primaryCta: o.mainGoal.primaryCta || "Contact us",
      secondaryCta: "",
      imageUrl: teamAsset.previewDataUrl,
    });
  }

  if (videoAsset?.previewDataUrl && hasFeature(extra, "Video section")) {
    sections.push({
      type: "video",
      headline: "Watch",
      videoUrl: videoAsset.previewDataUrl,
      description: videoAsset.altText || "",
    });
  }

  if (hasFeature(extra, "FAQ") && faqPairs.length) {
    sections.push({
      type: "faq",
      headline: "FAQ",
      items: faqPairs,
    });
  }

  if (hasFeature(extra, "Google Maps") && o.localBusiness.showMap && mapAddress) {
    sections.push({
      type: "map",
      headline: "Find us",
      address: mapAddress,
      placeId: o.localBusiness.placeId?.trim() ?? "",
      openingHours: o.localBusiness.showHours ? (o.localBusiness.openingHours?.trim() ?? "") : "",
      mapsLink: o.localBusiness.mapsLink?.trim() ?? "",
    });
  }

  if (hasFeature(extra, "Contact form")) {
    sections.push({
      type: "contact",
      headline: "Contact",
      formFields: ["name", "email", "phone", "message"],
    });
  }

  sections.push({
    type: "footer",
    tagline: `${name} · ${loc || "Online"} · ${o.mainGoal.preferredContact}`,
    links: [
      { label: "Privacy", href: "/legal/privacy" },
      { label: "Terms", href: "/legal/terms" },
    ],
  });

  const kw: string[] = [];
  if (o.seo.mainKeyword) kw.push(o.seo.mainKeyword);
  if (o.seo.secondaryKeywords) kw.push(...o.seo.secondaryKeywords.split(",").map((s) => s.trim()).filter(Boolean));
  if (o.seo.regionKeywords) kw.push(o.seo.regionKeywords);

  const imagePrompts = buildStructuredPrompts(o, heroPrompt);

  const raw = {
    business: {
      name,
      industry: o.basics.industry,
      location: loc,
      language: o.basics.language || "en",
      tone: o.branding.mood || "professional",
    },
    brand: {
      primaryColor: primary,
      secondaryColor: secondary,
      backgroundStyle: o.branding.websiteStyle,
      fontStyle: o.branding.fontStyle,
      designStyle: [o.branding.websiteStyle, o.branding.notes].filter(Boolean).join(" · ").slice(0, 200),
    },
    seo: {
      title:
        o.seo.metaTitleHint?.trim() ||
        `${name} — ${o.seo.mainKeyword || o.basics.industry}${loc ? ` (${loc})` : ""}`,
      description:
        o.seo.metaDescriptionHint?.trim() ||
        o.basics.description?.slice(0, 160) ||
        `${name} offers ${o.basics.industry.toLowerCase()} services${loc ? ` in ${loc}` : ""}.`,
      keywords: kw.length ? kw : [o.basics.industry, o.basics.city].filter(Boolean) as string[],
      localSeoText:
        o.seo.searchIntent?.trim() ||
        `${o.seo.mainKeyword || name} ${o.seo.regionKeywords || o.basics.city || ""}`.trim(),
    },
    pages: [{ slug: "home", title: "Home", sections }],
    conversionPlan: {
      mainGoal: o.mainGoal.primary,
      primaryCta: o.mainGoal.primaryCta || "Get in touch",
      secondaryCta: o.mainGoal.secondaryCta || "",
      trackingEvents: extra.filter((x) =>
        ["Contact form", "Booking button", "WhatsApp button", "Sticky mobile CTA"].includes(x),
      ),
    },
    imagePrompts,
    improvementIdeas: [
      "Add real photography when available to replace prompt placeholders.",
      "Tighten hero copy around the single highest-value action.",
      "Collect 2–3 testimonials with permission when you have them.",
    ],
    goals: {
      primary: o.mainGoal.primary,
      primaryCta: o.mainGoal.primaryCta,
      secondaryCta: o.mainGoal.secondaryCta,
      preferredContact: o.mainGoal.preferredContact,
    },
    targetAudience: {
      who: o.targetAudience.who,
      problems: o.targetAudience.problems,
      careAbout: o.targetAudience.careAbout,
      feelTags: o.targetAudience.feelTags,
    },
    services: o.offers.services,
    packages: o.packages,
    media: o.media.assets,
    localBusiness: {
      address: o.localBusiness.address,
      serviceArea: o.localBusiness.serviceArea,
      phone: o.localBusiness.phone,
      email: o.localBusiness.email,
      openingHours: o.localBusiness.openingHours,
      mapsLink: o.localBusiness.mapsLink,
      placeId: o.localBusiness.placeId,
      showMap: o.localBusiness.showMap,
      showHours: o.localBusiness.showHours,
      showLocalTrust: o.localBusiness.showLocalTrust,
    },
    trust: {
      yearsExperience: o.trust.yearsExperience,
      certifications: o.trust.certifications,
      awards: o.trust.awards,
      guarantees: o.trust.guarantees,
      paymentMethods: o.trust.paymentMethods,
      reviewPlatforms: o.trust.reviewPlatforms as Record<string, string>,
      hideEmptyReviews: o.trust.hideEmptyReviews,
    },
    pagesPlan: o.sitePages,
    extraFeatures: extra,
  };

  return parseWebsiteBlueprint(raw);
}

function buildStructuredPrompts(o: OnboardingPayload, heroPrompt: string) {
  const style = o.imageDirection.preferredStyle || "Premium photography";
  const out: { section: string; prompt: string; purpose: string; style: string }[] = [];
  if (!o.imageDirection.generatePrompts) return out;

  if (heroPrompt) {
    out.push({
      section: "hero",
      prompt: heroPrompt,
      purpose: "Hero visual",
      style,
    });
  }
  out.push({
    section: "services",
    prompt: `${o.basics.industry} service context — authentic, well-lit, on-brand`,
    purpose: "Services imagery",
    style,
  });
  if (hasFeature(o.extraFeatures ?? [], "Gallery")) {
    out.push({
      section: "gallery",
      prompt: `Portfolio or results suitable for ${o.basics.city || "local"} clientele`,
      purpose: "Gallery row",
      style,
    });
  }
  if (o.imageDirection.avoid) {
    out.push({
      section: "all",
      prompt: `Global avoid: ${o.imageDirection.avoid}`,
      purpose: "Constraints",
      style: "note",
    });
  }
  return out;
}
