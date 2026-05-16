import type { BlueprintSection } from "@/lib/validators/website-blueprint";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Hero = Extract<BlueprintSection, { type: "hero" }>;

export function HeroSection({ section }: { section: Hero }) {
  return (
    <section id="top" className="relative overflow-hidden border-b border-border/60">
      <div className="pointer-events-none absolute inset-0 bg-hero-glow" />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
        <div className="space-y-6">
          <Badge variant="muted" className="rounded-full">
            AI draft — expert refinement available
          </Badge>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            {section.headline}
          </h1>
          <p className="text-pretty text-lg text-muted-foreground">
            {section.subheadline}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-2xl">
              <a href="#contact">{section.primaryCta || "Get in touch"}</a>
            </Button>
            {section.secondaryCta ? (
              <Button asChild size="lg" variant="outline" className="rounded-2xl">
                <a href="#services">{section.secondaryCta}</a>
              </Button>
            ) : null}
          </div>
          {section.imagePrompt ? (
            <p className="text-xs text-muted-foreground/80">
              Image direction: {section.imagePrompt}
            </p>
          ) : null}
        </div>
        <div className="relative rounded-3xl border border-border/60 bg-gradient-to-br from-primary/15 via-secondary/10 to-accent/10 p-1 shadow-2xl">
          <div className="rounded-[1.35rem] bg-card/90 p-2 backdrop-blur sm:p-4">
            {section.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={section.imageUrl}
                alt=""
                className="aspect-[4/3] w-full rounded-2xl object-cover"
              />
            ) : (
              <>
                <p className="px-4 pt-4 text-sm font-medium text-muted-foreground">Live preview</p>
                <div className="mt-4 space-y-3 rounded-2xl border border-dashed border-border/80 p-4">
                  <div className="h-3 w-2/3 rounded-full bg-muted" />
                  <div className="h-3 w-1/2 rounded-full bg-muted" />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="h-24 rounded-xl bg-muted/60" />
                    <div className="h-24 rounded-xl bg-muted/40" />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
