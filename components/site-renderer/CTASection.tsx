import type { BlueprintSection } from "@/lib/validators/website-blueprint";
import { Button } from "@/components/ui/button";

type C = Extract<BlueprintSection, { type: "cta" }>;

export function CTASection({ section }: { section: C }) {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="rounded-3xl border border-border/60 bg-gradient-to-r from-primary/15 via-secondary/10 to-accent/10 p-10 text-center shadow-inner">
        <h2 className="text-3xl font-semibold tracking-tight">{section.headline}</h2>
        {section.body ? (
          <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground">
            {section.body}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {section.primaryCta ? (
            <Button asChild size="lg" className="rounded-2xl">
              <a href="#contact">{section.primaryCta}</a>
            </Button>
          ) : null}
          {section.secondaryCta ? (
            <Button asChild size="lg" variant="outline" className="rounded-2xl">
              <a href="#services">{section.secondaryCta}</a>
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
