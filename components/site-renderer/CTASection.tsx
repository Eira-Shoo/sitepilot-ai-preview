import type { BlueprintSection } from "@/lib/validators/website-blueprint";
import { Button } from "@/components/ui/button";
import { VisualPlaceholder } from "./VisualPlaceholder";

type C = Extract<BlueprintSection, { type: "cta" }>;

export function CTASection({ section }: { section: C }) {
  const isWhy = section.headline.toLowerCase().includes("why");

  return (
    <section
      id={isWhy ? "why-us" : undefined}
      className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20"
    >
      <div className="grid gap-8 overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-[var(--sp-primary,#0f172a)]/50 via-card to-[var(--sp-secondary,#c9a227)]/10 shadow-xl lg:grid-cols-2 lg:items-center">
        {section.imageUrl ? (
          <div className="relative min-h-[240px] lg:min-h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={section.imageUrl} alt="" className="h-full min-h-[240px] w-full object-cover" />
          </div>
        ) : isWhy ? (
          <VisualPlaceholder
            imagePrompt="Professional team or studio environment — premium, welcoming"
            label="Why us"
            aspectClass="min-h-[240px] lg:min-h-full"
            className="rounded-none border-0 lg:min-h-[320px]"
          />
        ) : null}
        <div className={`p-8 sm:p-10 lg:p-12 ${section.imageUrl || isWhy ? "lg:text-left" : "text-center"}`}>
          <p className="text-sm font-semibold uppercase tracking-widest text-[var(--sp-secondary,#c9a227)]">
            {isWhy ? "Why choose us" : "Get started"}
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{section.headline}</h2>
          {section.body ? (
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground lg:mx-0">
              {section.body}
            </p>
          ) : null}
          <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
            {section.primaryCta ? (
              <Button
                asChild
                size="lg"
                className="rounded-2xl bg-[var(--sp-secondary,#c9a227)] px-8 text-[var(--sp-primary,#0a0a0a)] hover:opacity-90"
              >
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
      </div>
    </section>
  );
}
