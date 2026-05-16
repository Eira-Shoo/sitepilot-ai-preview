import type { WebsiteBlueprint } from "@/lib/validators/website-blueprint";

/** Demo / no-LLM: apply lightweight heuristics so the AI editor still feels responsive. */
export function mockEditBlueprint(
  blueprint: WebsiteBlueprint,
  instruction: string,
): WebsiteBlueprint {
  const ins = instruction.toLowerCase();
  const next = structuredClone(blueprint);
  const home = next.pages.find((p) => p.slug === "home") ?? next.pages[0];

  if (ins.includes("premium") || ins.includes("luxury")) {
    next.brand.designStyle = `${next.brand.designStyle} · premium refinement`.slice(0, 200);
    next.brand.primaryColor = "#0f172a";
    next.brand.secondaryColor = "#c4a962";
    next.business.tone = "premium and assured";
  }

  if (ins.includes("logo") && ins.includes("hero")) {
    const logo = next.media?.find((m) => m.assetType?.toLowerCase() === "logo");
    if (logo?.previewDataUrl) {
      const hero = home.sections.find((s) => s.type === "hero");
      if (hero && hero.type === "hero") {
        hero.imageUrl = logo.previewDataUrl;
        hero.imagePrompt = `Use brand logo in hero context: ${logo.altText || logo.fileName}`;
      }
    }
  }

  if (ins.includes("pricing") && (ins.includes("higher") || ins.includes("move"))) {
    const pricingIdx = home.sections.findIndex((s) => s.type === "pricing");
    const servicesIdx = home.sections.findIndex((s) => s.type === "services");
    if (pricingIdx > -1 && servicesIdx > -1 && pricingIdx > servicesIdx) {
      const [pr] = home.sections.splice(pricingIdx, 1);
      home.sections.splice(servicesIdx + 1, 0, pr);
    }
  }

  if (ins.includes("trust")) {
    const hasTrust = home.sections.some((s) => s.type === "trust");
    if (!hasTrust) {
      const heroIdx = home.sections.findIndex((s) => s.type === "hero");
      home.sections.splice(heroIdx + 1, 0, {
        type: "trust",
        headline: "Why clients choose us",
        items: [
          "Clear, honest positioning",
          "Structured process",
          "Responsive communication",
        ],
      });
    }
  }

  if (ins.includes("cta") && (ins.includes("soft") || ins.includes("softer"))) {
    const hero = home.sections.find((s) => s.type === "hero");
    if (hero && hero.type === "hero") {
      hero.primaryCta = hero.primaryCta?.replace(/now|today|book/gi, (m: string) =>
        m.toLowerCase() === "book" ? "Schedule a chat" : "Learn more",
      );
    }
    next.conversionPlan.primaryCta = next.conversionPlan.primaryCta || "Learn more";
  }

  if (ins.includes("local")) {
    const hero = home.sections.find((s) => s.type === "hero");
    if (hero && hero.type === "hero") {
      hero.subheadline = `${hero.subheadline || ""} Serving local customers with a personal touch.`.trim();
    }
    next.seo.localSeoText = `${next.seo.localSeoText} Local, approachable, and nearby.`.trim();
  }

  if (ins.includes("faq")) {
    const faq = home.sections.find((s) => s.type === "faq");
    if (faq && faq.type === "faq") {
      faq.items = [
        ...faq.items,
        {
          question: "What happens after I reach out?",
          answer:
            "We follow up with clear next steps and timeline — no pressure, no surprise fees in this draft preview.",
        },
      ];
    } else {
      home.sections.push({
        type: "faq",
        headline: "FAQ",
        items: [
          {
            question: "How do I get started?",
            answer: "Use the contact options on this page — we built the flow around your preferred contact method.",
          },
        ],
      });
    }
  }

  if (ins.includes("image prompt")) {
    next.imagePrompts = [
      ...next.imagePrompts,
      {
        section: "services",
        prompt: "Editor request: add cohesive section imagery across services",
        purpose: "Visual direction",
        style: next.brand.designStyle || "balanced",
      },
    ];
  }

  next.improvementIdeas = [
    `Applied demo edit: ${instruction.slice(0, 80)}${instruction.length > 80 ? "…" : ""}`,
    ...(next.improvementIdeas ?? []).slice(0, 5),
  ];

  return next;
}
