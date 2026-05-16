import type { BlueprintSection } from "@/lib/validators/website-blueprint";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Clock } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { SECTION_CONTAINER, SECTION_PADDING } from "./section-styles";

type Pricing = Extract<BlueprintSection, { type: "pricing" }>;
type PricingItem = {
  name: string;
  description: string;
  price: string;
  duration: string;
  cta: string;
  included?: string;
};

export function PricingSection({ section }: { section: Pricing }) {
  const count = section.items.length;
  const featured = count >= 2 ? Math.floor(count / 2) : 0;
  const gridClass =
    count === 1
      ? "mx-auto max-w-lg"
      : count === 2
        ? "md:grid-cols-2"
        : "md:grid-cols-3";

  return (
    <section id="pricing" className={`border-y border-border/60 bg-muted/20 ${SECTION_PADDING}`}>
      <div className={SECTION_CONTAINER}>
        <SectionHeader
          label="Pricing"
          title={section.headline || "Transparent pricing"}
          description="No hidden fees — choose the option that fits your needs."
        />
        <div className={`mt-14 grid gap-8 ${gridClass}`}>
          {section.items.map((item: PricingItem, i: number) => {
            const isFeatured = i === featured;
            return (
              <Card
                key={i}
                className={`relative flex flex-col overflow-hidden rounded-3xl border-2 text-center transition ${
                  isFeatured
                    ? "border-[var(--sp-secondary,#c9a227)] bg-gradient-to-b from-[var(--sp-secondary,#c9a227)]/10 via-card to-card shadow-xl ring-2 ring-[var(--sp-secondary,#c9a227)]/25 lg:scale-[1.03]"
                    : "border-border/50 bg-card/80 shadow-sm hover:border-border"
                }`}
              >
                {isFeatured ? (
                  <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--sp-secondary,#c9a227)] px-4 py-1 text-xs font-bold uppercase tracking-wide text-[var(--sp-primary,#0a0a0a)]">
                    Recommended
                  </span>
                ) : null}
                <CardHeader className="space-y-4 px-6 pb-2 pt-10">
                  <CardTitle className="text-xl font-bold sm:text-2xl">{item.name}</CardTitle>
                  <p className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                    {item.price}
                  </p>
                  {item.duration ? (
                    <p className="flex items-center justify-center gap-1.5 text-base text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {item.duration}
                    </p>
                  ) : null}
                </CardHeader>
                <CardContent className="mt-auto space-y-5 px-6 pb-8">
                  {item.description ? (
                    <p className="text-base leading-relaxed text-muted-foreground">{item.description}</p>
                  ) : null}
                  {item.included ? (
                    <p className="flex items-start justify-center gap-2 text-left text-sm leading-relaxed sm:text-center">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-[var(--sp-secondary,#c9a227)]" />
                      <span>{item.included}</span>
                    </p>
                  ) : null}
                  <Button
                    asChild
                    size="lg"
                    className={`h-12 w-full rounded-xl text-base font-semibold ${
                      isFeatured
                        ? "bg-[var(--sp-secondary,#c9a227)] text-[var(--sp-primary,#0a0a0a)] hover:opacity-90"
                        : ""
                    }`}
                    variant={isFeatured ? "default" : "secondary"}
                  >
                    <a href="#contact">{item.cta || "Book now"}</a>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
