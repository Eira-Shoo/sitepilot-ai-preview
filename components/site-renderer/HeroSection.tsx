import type { BlueprintSection } from "@/lib/validators/website-blueprint";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VisualPlaceholder } from "./VisualPlaceholder";
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
  const badges = trustBadges.slice(0, 4);

  return (
    <section id="top" className="relative overflow-hidden border-b border-border/60">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_-15%,hsl(var(--secondary)/0.22),transparent)]" />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-20">
        <div className="space-y-6 animate-fade-up">
          {businessName ? (
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--sp-secondary,#c9a227)]">
              {businessName}
            </p>
          ) : null}
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
            {section.headline}
          </h1>
          <p className="max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
            {section.subheadline}
          </p>
          {location ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-[var(--sp-secondary,#c9a227)]" />
              {location}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="rounded-2xl bg-[var(--sp-secondary,#c9a227)] px-8 text-[var(--sp-primary,#0a0a0a)] hover:opacity-90"
            >
              <a href="#contact">{section.primaryCta || "Book now"}</a>
            </Button>
            {section.secondaryCta ? (
              <Button asChild size="lg" variant="outline" className="rounded-2xl border-border/80">
                <a href="#services">{section.secondaryCta}</a>
              </Button>
            ) : null}
          </div>
          {badges.length ? (
            <div className="flex flex-wrap gap-2 pt-2">
              {badges.map((item, i) => (
                <Badge
                  key={i}
                  variant="muted"
                  className="gap-1.5 rounded-full border border-border/60 bg-card/80 px-3 py-1.5 text-xs font-medium"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-[var(--sp-secondary,#c9a227)]" />
                  {item}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
        <div className="relative rounded-3xl border border-border/50 bg-gradient-to-br from-[var(--sp-primary,#0f172a)]/40 via-card/80 to-[var(--sp-secondary,#c9a227)]/10 p-1 shadow-2xl">
          <div className="overflow-hidden rounded-[1.35rem] bg-card/95 backdrop-blur">
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
                aspectClass="aspect-[4/3] min-h-[280px]"
                className="rounded-none border-0"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
