import type { BlueprintSection } from "@/lib/validators/website-blueprint";
import { serviceDescriptionFallback } from "@/lib/blueprint/blueprint-cleanup";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Sparkles } from "lucide-react";
import { VisualPlaceholder } from "./VisualPlaceholder";

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

export function ServicesSection({ section }: { section: Services }) {
  return (
    <section id="services" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-[var(--sp-secondary,#c9a227)]">
          Services
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{section.headline}</h2>
        <p className="mt-3 text-muted-foreground">
          Transparent pricing and clear durations — book the service that fits you.
        </p>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {section.items.map((item: ServiceItem, i: number) => {
          const priceLine = [item.price, item.duration].filter(Boolean).join(" · ");
          const description =
            item.description?.trim() || serviceDescriptionFallback(item.name);
          return (
            <Card
              key={i}
              className="flex flex-col overflow-hidden rounded-2xl border-border/60 bg-card/80 shadow-sm transition hover:border-[var(--sp-secondary,#c9a227)]/40 hover:shadow-md"
            >
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt={item.name} className="h-44 w-full object-cover" />
              ) : (
                <VisualPlaceholder
                  imagePrompt={`${item.name} — professional service photography`}
                  label="Service"
                  aspectClass="aspect-[16/9] h-36"
                  className="rounded-none border-0 border-b border-border/40"
                />
              )}
              <CardHeader className="pb-2">
                <CardTitle className="flex items-start gap-2 text-xl">
                  <Sparkles className="mt-1 h-4 w-4 shrink-0 text-[var(--sp-secondary,#c9a227)]" />
                  {item.name}
                </CardTitle>
                {priceLine ? (
                  <p className="text-lg font-semibold text-foreground">{priceLine}</p>
                ) : null}
              </CardHeader>
              <CardContent className="mt-auto space-y-4">
                <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
                {item.included ? (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Includes: </span>
                    {item.included}
                  </p>
                ) : null}
                {item.whoFor ? (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Ideal for: </span>
                    {item.whoFor}
                  </p>
                ) : null}
                {item.duration && !priceLine.includes(item.duration) ? (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {item.duration}
                  </p>
                ) : null}
                <Button
                  asChild
                  className="w-full rounded-xl bg-[var(--sp-secondary,#c9a227)] text-[var(--sp-primary,#0a0a0a)] hover:opacity-90"
                >
                  <a href="#contact">{item.cta || "Book now"}</a>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
