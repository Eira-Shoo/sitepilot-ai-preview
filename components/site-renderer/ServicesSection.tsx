import type { BlueprintSection } from "@/lib/validators/website-blueprint";
import { serviceDescriptionFallback } from "@/lib/blueprint/blueprint-cleanup";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { VisualPlaceholder } from "./VisualPlaceholder";
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

type Services = Extract<BlueprintSection, { type: "services" }>;
type ServiceItem = {
  name: string;
  description: string;
  price: string;
  duration: string;
  cta: string;
  whoFor?: string;
  included?: string;
  imageUrl?: string;
};

const DEFAULT_CTA = "Book now";

function bookingCtaLabel(cta?: string): string {
  const t = cta?.trim();
  if (!t) return DEFAULT_CTA;
  if (/book/i.test(t)) return t;
  return DEFAULT_CTA;
}

export function ServicesSection({ section }: { section: Services }) {
  const count = section.items.length;
  const gridClass =
    count === 1
      ? "mx-auto max-w-lg"
      : count === 2
        ? "md:grid-cols-2"
        : "md:grid-cols-2 lg:grid-cols-3";

  return (
    <section id="services" className={SECTION_PADDING}>
      <div className={SECTION_CONTAINER}>
        <SectionHeader
          label="Services"
          title={section.headline || "Our services"}
          description="Transparent pricing and clear durations — book the service that fits you."
        />
        <div className={`mt-14 grid gap-8 sm:gap-10 ${gridClass}`}>
          {section.items.map((item: ServiceItem, i: number) => {
            const description =
              item.description?.trim() || serviceDescriptionFallback(item.name);
            return (
              <Card
                key={i}
                className="flex flex-col overflow-hidden rounded-3xl border-border/60 bg-card/90 shadow-md transition hover:border-[var(--sp-secondary,#c9a227)]/45 hover:shadow-lg"
              >
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt={item.name} className="h-52 w-full object-cover" />
                ) : (
                  <VisualPlaceholder
                    imagePrompt={`${item.name} — professional service photography`}
                    label="Service"
                    aspectClass="aspect-[16/10] min-h-[180px]"
                    className="rounded-none border-0 border-b border-border/40"
                  />
                )}
                <CardHeader className={`space-y-4 ${CARD_PAD} pb-0`}>
                  <CardTitle className={CARD_TITLE}>{item.name}</CardTitle>
                  {(item.price || item.duration) && (
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-4">
                      {item.price ? <span className={CARD_PRICE}>{item.price}</span> : null}
                      {item.duration ? (
                        <span className={`flex items-center gap-2 ${CARD_META}`}>
                          <Clock className="h-5 w-5 shrink-0 text-[var(--sp-secondary,#c9a227)]" />
                          {item.duration}
                        </span>
                      ) : null}
                    </div>
                  )}
                </CardHeader>
                <CardContent className={`mt-auto flex flex-col gap-5 ${CARD_PAD} pt-0`}>
                  <p className={CARD_BODY}>{description}</p>
                  {item.included ? (
                    <p className={`${CARD_META} leading-relaxed`}>
                      <span className="font-semibold text-foreground">Includes: </span>
                      {item.included}
                    </p>
                  ) : null}
                  {item.whoFor ? (
                    <p className={`${CARD_META} leading-relaxed`}>
                      <span className="font-semibold text-foreground">Ideal for: </span>
                      {item.whoFor}
                    </p>
                  ) : null}
                  <Button
                    asChild
                    size="lg"
                    className={`${TAP_BUTTON} bg-[var(--sp-secondary,#c9a227)] text-[var(--sp-primary,#0a0a0a)] hover:opacity-90`}
                  >
                    <a href="#contact">{bookingCtaLabel(item.cta)}</a>
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
