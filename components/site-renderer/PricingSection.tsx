import type { BlueprintSection } from "@/lib/validators/website-blueprint";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Clock } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import {
  CARD_BODY,
  CARD_META,
  CARD_PAD,
  CARD_PRICE,
  CARD_TITLE,
  SECTION_CONTAINER,
  SECTION_PADDING,
  TAP_BUTTON,
} from "./section-styles";

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
        <div className={`mt-14 grid gap-8 sm:gap-10 ${gridClass}`}>
          {section.items.map((item: PricingItem, i: number) => {
            const isFeatured = i === featured;
            return (
              <Card
                key={i}
                className={`relative flex flex-col overflow-hidden rounded-3xl border-2 text-center transition ${
                  isFeatured
                    ? "z-10 border-[var(--sp-secondary,#c9a227)] bg-gradient-to-b from-[var(--sp-secondary,#c9a227)]/15 via-card to-card shadow-2xl ring-2 ring-[var(--sp-secondary,#c9a227)]/30 md:scale-[1.04]"
                    : "border-border/50 bg-card/85 shadow-md hover:border-border"
                }`}
              >
                {isFeatured ? (
                  <span className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--sp-secondary,#c9a227)] px-5 py-1.5 text-xs font-bold uppercase tracking-wide text-[var(--sp-primary,#0a0a0a)] sm:text-sm">
                    Recommended
                  </span>
                ) : null}
                <CardHeader className={`space-y-4 ${CARD_PAD} pb-2 ${isFeatured ? "pt-12" : "pt-10"}`}>
                  <CardTitle className={`${CARD_TITLE} text-center`}>{item.name}</CardTitle>
                  <p className={`${CARD_PRICE} text-center`}>{item.price}</p>
                  {item.duration ? (
                    <p className={`flex items-center justify-center gap-2 ${CARD_META}`}>
                      <Clock className="h-5 w-5 shrink-0 text-[var(--sp-secondary,#c9a227)]" />
                      {item.duration}
                    </p>
                  ) : null}
                </CardHeader>
                <CardContent className={`mt-auto space-y-5 ${CARD_PAD} pt-0`}>
                  {item.description ? (
                    <p className={`${CARD_BODY} text-center`}>{item.description}</p>
                  ) : null}
                  {item.included ? (
                    <p className={`flex items-start justify-center gap-2 ${CARD_META} leading-relaxed`}>
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-[var(--sp-secondary,#c9a227)]" />
                      <span>{item.included}</span>
                    </p>
                  ) : null}
                  <Button
                    asChild
                    size="lg"
                    className={`${TAP_BUTTON} ${
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
