import type { BlueprintSection } from "@/lib/validators/website-blueprint";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Pricing = Extract<BlueprintSection, { type: "pricing" }>;

export function PricingSection({ section }: { section: Pricing }) {
  return (
    <section id="pricing" className="border-y border-border/60 bg-muted/20 py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-center text-3xl font-semibold tracking-tight">
          {section.headline}
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {section.items.map((item, i) => (
            <Card
              key={i}
              className="rounded-2xl border-border/60 bg-card/80 shadow-sm"
            >
              <CardHeader>
                <CardTitle>{item.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{item.description}</p>
                <p className="text-2xl font-semibold">{item.price}</p>
                {item.cta ? (
                  <Button asChild className="w-full rounded-xl">
                    <a href="#contact">{item.cta}</a>
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
