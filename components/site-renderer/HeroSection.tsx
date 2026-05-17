import type { BlueprintSection } from "@/lib/validators/website-blueprint";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VisualPlaceholder } from "./VisualPlaceholder";
import { SECTION_CONTAINER, TAP_BUTTON } from "./section-styles";
import { MapPin, ShieldCheck } from "lucide-react";

type Hero = Extract<BlueprintSection, { type: "hero" }>;

export function HeroSection({
  section,
  businessName,
  location,
  trustBadges = [],
}: {
  section: Hero;
  businessName?: string;
  location?: string;
  trustBadges?: string[];
}) {
  const badges = trustBadges.slice(0, 3);

  return (
    <section id="top" className="relative overflow-hidden border-b border-border/60">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_-15%,hsl(var(--secondary)/0.28),transparent)]" />
      <div
        className={`${SECTION_CONTAINER} grid gap-12 py-16 sm:py-24 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-32`}
      >
        <div className="space-y-7 sm:space-y-8">
          {businessName ? (
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--sp-secondary,#c9a227)] sm:text-sm">
              {businessName}
            </p>
          ) : null}
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.5rem] lg:leading-[1.08]">
            {section.headline}
          </h1>
          <p className="max-w-xl text-pretty text-lg leading-[1.65] text-muted-foreground sm:text-xl sm:leading-[1.7]">
            {section.subheadline}
          </p>
          {location ? (
            <p className="flex items-center gap-2 text-base leading-relaxed text-muted-foreground sm:text-lg">
              <MapPin className="h-5 w-5 shrink-0 text-[var(--sp-secondary,#c9a227)]" />
              {location}
            </p>
          ) : null}
          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap">
            <Button
              asChild
              size="lg"
              className={`${TAP_BUTTON} rounded-2xl bg-[var(--sp-secondary,#c9a227)] px-8 text-[var(--sp-primary,#0a0a0a)] hover:opacity-90`}
            >
              <a href="#contact">{section.primaryCta || "Book an appointment"}</a>
            </Button>
            {section.secondaryCta ? (
              <Button
                asChild
                size="lg"
                variant="outline"
                className={`${TAP_BUTTON} rounded-2xl border-border/80 px-8`}
              >
                <a href="#services">{section.secondaryCta}</a>
              </Button>
            ) : null}
          </div>
          {badges.length ? (
            <div className="flex flex-col gap-2.5 pt-2 sm:flex-row sm:flex-wrap">
              {badges.map((item, i) => (
                <Badge
                  key={i}
                  variant="muted"
                  className="gap-2 rounded-full border border-border/60 bg-card/90 px-4 py-2.5 text-sm font-medium leading-snug sm:text-base"
                >
                  <ShieldCheck className="h-4 w-4 shrink-0 text-[var(--sp-secondary,#c9a227)]" />
                  {item}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
        <div className="relative rounded-3xl border border-[var(--sp-secondary,#c9a227)]/20 bg-gradient-to-br from-[var(--sp-primary,#0f172a)]/50 via-card/90 to-[var(--sp-secondary,#c9a227)]/15 p-1.5 shadow-2xl">
          <div className="overflow-hidden rounded-[1.35rem] bg-card/95 backdrop-blur-sm">
            {section.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={section.imageUrl}
                alt={businessName || section.headline}
                className="aspect-[4/3] w-full object-cover"
              />
            ) : (
              <VisualPlaceholder
                imagePrompt={section.imagePrompt}
                label="Hero visual"
                aspectClass="aspect-[4/3] min-h-[280px] sm:min-h-[360px]"
                className="rounded-none border-0"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
