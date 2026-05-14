import type { WebsiteBlueprint } from "@/lib/validators/website-blueprint";
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

type Props = {
  blueprint: WebsiteBlueprint;
  projectId?: string;
  publishedSlug?: string;
  showContactForm?: boolean;
};

export function WebsiteRenderer({
  blueprint,
  projectId,
  publishedSlug,
  showContactForm = true,
}: Props) {
  const home =
    blueprint.pages.find((p) => p.slug === "home") ?? blueprint.pages[0];
  const brand = blueprint.brand;
  const style = {
    ["--sp-primary" as string]: brand.primaryColor,
    ["--sp-secondary" as string]: brand.secondaryColor,
  } as React.CSSProperties;

  const hasNavbar = home.sections.some((s) => s.type === "navbar");
  const hasFooter = home.sections.some((s) => s.type === "footer");

  return (
    <div className="min-h-screen bg-background text-foreground" style={style}>
      {!hasNavbar && (
        <Navbar
          section={{
            type: "navbar",
            logoText: blueprint.business.name,
            links: [
              { label: "Services", href: "#services" },
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
            return <HeroSection key={`${section.type}-${idx}`} section={section} />;
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
            tagline: `${blueprint.business.name} — crafted with SitePilot AI`,
            links: [
              { label: "Privacy", href: "/legal/privacy" },
              { label: "Terms", href: "/legal/terms" },
            ],
          }}
        />
      )}
    </div>
  );
}
