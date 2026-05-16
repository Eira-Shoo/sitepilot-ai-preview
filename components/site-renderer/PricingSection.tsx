import type { BlueprintSection } from "@/lib/validators/website-blueprint";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

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

  return (
    <section id="pricing" className="border-y border-border/60 bg-muted/15 py-16 lg:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-[var(--sp-secondary,#c9a227)]">
            Pricing
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{section.headline}</h2>
          <p className="mt-3 text-muted-foreground">No hidden fees — choose the service that fits your needs.</p>
        </div>
        <div
          className={`mt-12 grid gap-6 ${
            count === 1 ? "max-w-md mx-auto" : count === 2 ? "md:grid-cols-2" : "md:grid-cols-3"
          }`}
        >
          {section.items.map((item: PricingItem, i: number) => {
            const isFeatured = i === featured;
            return (
              <Card
                key={i}
                className={`flex flex-col rounded-2xl border-border/60 bg-card/90 ${
                  isFeatured
                    ? "scale-[1.02] border-[var(--sp-secondary,#c9a227)]/50 shadow-lg ring-1 ring-[var(--sp-secondary,#c9a227)]/30"
                    : "shadow-sm"
                }`}
              >
                <CardHeader>
                  {isFeatured ? (
                    <span className="mb-2 inline-block w-fit rounded-full bg-[var(--sp-secondary,#c9a227)]/20 px-2.5 py-0.5 text-xs font-semibold text-[var(--sp-secondary,#c9a227)]">
                      Popular
                    </span>
                  ) : null}
                  <CardTitle className="text-xl">{item.name}</CardTitle>
                  <p className="text-3xl font-bold tracking-tight">{item.price}</p>
                  {item.duration ? (
                    <p className="text-sm text-muted-foreground">{item.duration}</p>
                  ) : null}
                </CardHeader>
                <CardContent className="mt-auto space-y-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                  {item.included ? (
                    <p className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--sp-secondary,#c9a227)]" />
                      <span>{item.included}</span>
                    </p>
                  ) : null}
                  <Button
                    asChild
                    className={`w-full rounded-xl ${
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
