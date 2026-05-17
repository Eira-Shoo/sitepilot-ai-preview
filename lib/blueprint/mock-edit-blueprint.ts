import type { WebsiteBlueprint } from "@/lib/validators/website-blueprint";

function home(bp: WebsiteBlueprint) {
  return bp.pages.find((p) => p.slug === "home") ?? bp.pages[0];
}

function moveSectionBefore(
  sections: WebsiteBlueprint["pages"][number]["sections"],
  type: string,
  beforeType: string,
) {
  const idx = sections.findIndex((s) => s.type === type);
  const beforeIdx = sections.findIndex((s) => s.type === beforeType);
  if (idx === -1 || beforeIdx === -1 || idx < beforeIdx) return;
  const [block] = sections.splice(idx, 1);
  const insertAt = sections.findIndex((s) => s.type === beforeType);
  sections.splice(insertAt, 0, block);
}

/** Demo / no-LLM: apply heuristics so the AI editor stays responsive offline. */
export function mockEditBlueprint(
  blueprint: WebsiteBlueprint,
  instruction: string,
): WebsiteBlueprint {
  const ins = instruction.toLowerCase();
  const next = structuredClone(blueprint);
  const page = home(next);
  if (!page) return next;

  const luxury =
    ins.includes("luxury") ||
    ins.includes("premium") ||
    ins.includes("more premium") ||
    ins.includes("more luxury");
  const gold = ins.includes("gold") || luxury;

  if (luxury || gold) {
    next.brand.designStyle = `${next.brand.designStyle || ""} · premium luxury refinement`
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 200);
    next.brand.primaryColor = "#0a0a0a";
    next.brand.secondaryColor = "#c9a227";
    next.brand.backgroundStyle = "dark premium";
    next.business.tone = "premium and assured";
  }

  if (ins.includes("minimal")) {
    page.sections = page.sections.filter(
      (s) => !["gallery", "video", "before_after"].includes(s.type),
    );
    next.brand.designStyle = `${next.brand.designStyle || ""} · minimal clean`.slice(0, 200);
  }

  if (ins.includes("remove") && ins.includes("gallery")) {
    page.sections = page.sections.filter((s) => s.type !== "gallery");
  }

  if (ins.includes("shorter") && ins.includes("hero")) {
    const hero = page.sections.find((s) => s.type === "hero");
    if (hero?.type === "hero" && hero.subheadline) {
      const words = hero.subheadline.split(/\s+/);
      hero.subheadline = words.slice(0, Math.min(18, words.length)).join(" ");
      if (words.length > 18) hero.subheadline += "…";
    }
  }

  if (ins.includes("pricing") && (ins.includes("higher") || ins.includes("move") || ins.includes("above"))) {
    moveSectionBefore(page.sections, "pricing", "services");
    const pricingIdx = page.sections.findIndex((s) => s.type === "pricing");
    const heroIdx = page.sections.findIndex((s) => s.type === "hero");
    if (pricingIdx > -1 && heroIdx > -1 && pricingIdx > heroIdx + 1) {
      const [pr] = page.sections.splice(pricingIdx, 1);
      page.sections.splice(heroIdx + 1, 0, pr);
    }
  }

  if (ins.includes("trust")) {
    const hasTrust = page.sections.some((s) => s.type === "trust");
    if (!hasTrust) {
      const heroIdx = page.sections.findIndex((s) => s.type === "hero");
      page.sections.splice(heroIdx + 1, 0, {
        type: "trust",
        headline: "Why clients choose us",
        items: [
          "Years of professional experience",
          "Clean, premium environment",
          "Easy online booking",
          "Trusted by local clients",
        ].slice(0, 4),
      });
    } else {
      const trust = page.sections.find((s) => s.type === "trust");
      if (trust?.type === "trust" && ins.includes("strong")) {
        trust.items = [
          ...trust.items,
          "Premium service standards",
          "Transparent pricing",
        ].slice(0, 4);
      }
    }
  }

  if (ins.includes("local") || ins.includes("seo")) {
    const hero = page.sections.find((s) => s.type === "hero");
    if (hero?.type === "hero") {
      hero.subheadline = `${hero.subheadline || ""} Proudly serving local customers in ${next.business.location || "your area"}.`.trim();
    }
    next.seo.localSeoText = `${next.seo.localSeoText || next.business.name} — local ${next.business.industry} services.`.trim();
    const keywords = new Set(next.seo.keywords ?? []);
    if (next.business.location) keywords.add(next.business.location.toLowerCase());
    next.seo.keywords = [...keywords].slice(0, 12);
  }

  if (ins.includes("color")) {
    next.brand.secondaryColor = gold || ins.includes("gold") ? "#c9a227" : "#8b5cf6";
    if (ins.includes("dark")) next.brand.primaryColor = "#0a0a0a";
  }

  if (ins.includes("mobile") && ins.includes("cta")) {
    if (!next.extraFeatures?.includes("Sticky mobile CTA")) {
      next.extraFeatures = [...(next.extraFeatures ?? []), "Sticky mobile CTA"];
    }
    next.conversionPlan.primaryCta = next.conversionPlan.primaryCta || "Book now";
  }

  if (ins.includes("cta") && (ins.includes("soft") || ins.includes("softer"))) {
    const hero = page.sections.find((s) => s.type === "hero");
    if (hero?.type === "hero") {
      hero.primaryCta = "Get in touch";
      hero.secondaryCta = hero.secondaryCta || "Learn more";
    }
    next.conversionPlan.primaryCta = "Get in touch";
  }

  if (ins.includes("book") && ins.includes("appointment")) {
    const hero = page.sections.find((s) => s.type === "hero");
    if (hero?.type === "hero") hero.primaryCta = "Book an appointment";
    next.conversionPlan.primaryCta = "Book an appointment";
    const services = page.sections.find((s) => s.type === "services");
    if (services?.type === "services") {
      for (const item of services.items) {
        item.cta = "Book now";
      }
    }
  }

  if (ins.includes("faq")) {
    const faq = page.sections.find((s) => s.type === "faq");
    if (faq?.type === "faq") {
      faq.items = [
        ...faq.items,
        {
          question: "What happens after I reach out?",
          answer:
            "We confirm your request and follow up with clear next steps — no pressure in this draft preview.",
        },
        {
          question: "Do you serve local clients?",
          answer: `Yes — we focus on customers in ${next.business.location || "your area"}.`,
        },
      ].slice(0, 5);
    } else {
      page.sections.push({
        type: "faq",
        headline: "FAQ",
        items: [
          {
            question: "How do I get started?",
            answer: "Use the contact options on this page to reach us directly.",
          },
        ],
      });
    }
  }

  if (ins.includes("logo") && ins.includes("hero")) {
    const logo = next.media?.find((m) => m.assetType?.toLowerCase() === "logo");
    if (logo?.previewDataUrl) {
      const hero = page.sections.find((s) => s.type === "hero");
      if (hero?.type === "hero") {
        hero.imageUrl = logo.previewDataUrl;
        hero.imagePrompt = `Brand logo in hero: ${logo.altText || logo.fileName}`;
      }
    }
  }

  if (ins.includes("image prompt")) {
    next.imagePrompts = [
      ...next.imagePrompts,
      {
        section: "services",
        prompt: "Premium cohesive imagery across all service cards",
        purpose: "Visual direction",
        style: next.brand.designStyle || "premium",
      },
    ];
  }

  next.improvementIdeas = [
    `Applied edit: ${instruction.slice(0, 80)}${instruction.length > 80 ? "…" : ""}`,
    ...(next.improvementIdeas ?? []).slice(0, 5),
  ];

  return next;
}
