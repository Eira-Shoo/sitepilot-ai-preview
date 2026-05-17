import type { WebsiteBlueprint } from "@/lib/validators/website-blueprint";
import { hexToHslComponents } from "@/lib/utils/color";
import { HeroSection } from "./HeroSection";
import { ServicesSection } from "./ServicesSection";
import { PricingSection } from "./PricingSection";
import { TrustSection } from "./TrustSection";
import { TestimonialsSection } from "./TestimonialsSection";
import { FAQSection } from "./FAQSection";
import { ContactSection } from "./ContactSection";
import { MapSection } from "./MapSection";
import { GallerySection } from "./GallerySection";
import { BeforeAfterSection } from "./BeforeAfterSection";
import { ProcessSection } from "./ProcessSection";
import { CTASection } from "./CTASection";
import { FooterSection } from "./FooterSection";
import { Navbar } from "./Navbar";
import { VideoSection } from "./VideoSection";

type Props = {
  blueprint: WebsiteBlueprint;
  projectId?: string;
  publishedSlug?: string;
  showContactForm?: boolean;
};

function brandThemeStyle(brand: WebsiteBlueprint["brand"]): React.CSSProperties {
  const primaryHsl = hexToHslComponents(brand.primaryColor);
  const secondaryHsl = hexToHslComponents(brand.secondaryColor);
  const style: Record<string, string> = {
    "--sp-primary": brand.primaryColor,
    "--sp-secondary": brand.secondaryColor,
  };
  if (primaryHsl) {
    style["--primary"] = primaryHsl;
    style["--ring"] = primaryHsl;
  }
  if (secondaryHsl) {
    style["--secondary"] = secondaryHsl;
    style["--accent"] = secondaryHsl;
  }
  return style as React.CSSProperties;
}

export function WebsiteRenderer({
  blueprint,
  projectId,
  publishedSlug,
  showContactForm = true,
}: Props) {
  const home =
    blueprint.pages.find((p) => p.slug === "home") ?? blueprint.pages[0];
  const brand = blueprint.brand;
  const style = brandThemeStyle(brand);

  const hasNavbar = home.sections.some((s) => s.type === "navbar");
  const hasFooter = home.sections.some((s) => s.type === "footer");
  const stickyMobileCta = blueprint.extraFeatures?.includes("Sticky mobile CTA");
  const trustSection = home.sections.find((s) => s.type === "trust");
  const trustBadges =
    trustSection?.type === "trust" ? trustSection.items.slice(0, 4) : [];

  const logoFromMedia = blueprint.media?.find(
    (m) => m.assetType?.toLowerCase() === "logo" && m.previewDataUrl,
  );

  const primaryCta = blueprint.conversionPlan.primaryCta || "Book now";

  return (
    <div className="min-h-screen bg-background text-foreground" style={style}>
      {!hasNavbar && (
        <Navbar
          section={{
            type: "navbar",
            logoText: blueprint.business.name,
            logoUrl: logoFromMedia?.previewDataUrl ?? "",
            links: [
              { label: "Services", href: "#services" },
              { label: "Pricing", href: "#pricing" },
              { label: "Contact", href: "#contact" },
            ],
          }}
        />
      )}
      {home.sections.map((section, idx) => {
        switch (section.type) {
          case "navbar":
            return <Navbar key={`${section.type}-${idx}`} section={section} />;
          case "hero":
            return (
              <HeroSection
                key={`${section.type}-${idx}`}
                section={section}
                businessName={blueprint.business.name}
                location={blueprint.business.location}
                trustBadges={trustBadges}
              />
            );
          case "services":
            return (
              <ServicesSection key={`${section.type}-${idx}`} section={section} />
            );
          case "pricing":
            return (
              <PricingSection key={`${section.type}-${idx}`} section={section} />
            );
          case "trust":
            return <TrustSection key={`${section.type}-${idx}`} section={section} />;
          case "testimonials":
            return (
              <TestimonialsSection key={`${section.type}-${idx}`} section={section} />
            );
          case "faq":
            return <FAQSection key={`${section.type}-${idx}`} section={section} />;
          case "contact":
            return (
              <ContactSection
                key={`${section.type}-${idx}`}
                section={section}
                projectId={projectId}
                publishedSlug={publishedSlug}
                enabled={showContactForm}
              />
            );
          case "map":
            return <MapSection key={`${section.type}-${idx}`} section={section} />;
          case "gallery":
            return (
              <GallerySection key={`${section.type}-${idx}`} section={section} />
            );
          case "before_after":
            return (
              <BeforeAfterSection key={`${section.type}-${idx}`} section={section} />
            );
          case "process":
            return (
              <ProcessSection key={`${section.type}-${idx}`} section={section} />
            );
          case "cta":
            return <CTASection key={`${section.type}-${idx}`} section={section} />;
          case "video":
            return <VideoSection key={`${section.type}-${idx}`} section={section} />;
          case "footer":
            return <FooterSection key={`${section.type}-${idx}`} section={section} />;
          default:
            return null;
        }
      })}
      {!hasFooter && (
        <FooterSection
          section={{
            type: "footer",
            tagline: `${blueprint.business.name} — ${blueprint.business.location || "Professional services"}`,
            links: [
              { label: "Privacy", href: "/legal/privacy" },
              { label: "Terms", href: "/legal/terms" },
            ],
          }}
        />
      )}
      {stickyMobileCta ? (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
          <a
            href="#contact"
            className="flex min-h-12 h-12 w-full items-center justify-center rounded-2xl bg-[var(--sp-secondary,#c9a227)] text-base font-semibold text-[var(--sp-primary,#0a0a0a)] shadow-lg"
          >
            {primaryCta}
          </a>
        </div>
      ) : null}
    </div>
  );
}
