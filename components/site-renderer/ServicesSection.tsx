import type { BlueprintSection } from "@/lib/validators/website-blueprint";
import { serviceDescriptionFallback } from "@/lib/blueprint/blueprint-cleanup";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { VisualPlaceholder } from "./VisualPlaceholder";
import { SectionHeader } from "./SectionHeader";
import { SECTION_CONTAINER, SECTION_PADDING } from "./section-styles";

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

function bookingCtaLabel(cta?: string): string {
  const t = cta?.trim();
  if (!t) return "Book now";
  if (/book/i.test(t)) return t;
  return "Book now";
}

export function ServicesSection({ section }: { section: Services }) {
  const count = section.items.length;
  const gridClass =
    count === 1
      ? "mx-auto max-w-md"
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
        <div className={`mt-14 grid gap-8 ${gridClass}`}>
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
                  <img src={item.imageUrl} alt={item.name} className="h-48 w-full object-cover" />
                ) : (
                  <VisualPlaceholder
                    imagePrompt={`${item.name} — professional service photography`}
                    label="Service"
                    aspectClass="aspect-[16/10] min-h-[160px]"
                    className="rounded-none border-0 border-b border-border/40"
                  />
                )}
                <CardHeader className="space-y-3 px-6 pb-0 pt-6">
                  <CardTitle className="text-2xl font-bold leading-tight tracking-tight">
                    {item.name}
                  </CardTitle>
                  {(item.price || item.duration) && (
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      {item.price ? (
                        <span className="text-2xl font-bold text-[var(--sp-secondary,#c9a227)]">
                          {item.price}
                        </span>
                      ) : null}
                      {item.duration ? (
                        <span className="flex items-center gap-1.5 text-base text-muted-foreground">
                          <Clock className="h-4 w-4 shrink-0" />
                          {item.duration}
                        </span>
                      ) : null}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="mt-auto flex flex-col gap-4 px-6 pb-6 pt-4">
                  <p className="text-base leading-relaxed text-muted-foreground">{description}</p>
                  {item.included ? (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      <span className="font-semibold text-foreground">Includes: </span>
                      {item.included}
                    </p>
                  ) : null}
                  {item.whoFor ? (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      <span className="font-semibold text-foreground">Ideal for: </span>
                      {item.whoFor}
                    </p>
                  ) : null}
                  <Button
                    asChild
                    size="lg"
                    className="mt-2 h-12 w-full rounded-xl bg-[var(--sp-secondary,#c9a227)] text-base font-semibold text-[var(--sp-primary,#0a0a0a)] hover:opacity-90"
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
