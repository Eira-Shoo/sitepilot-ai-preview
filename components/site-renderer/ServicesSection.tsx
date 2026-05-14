import type { BlueprintSection } from "@/lib/validators/website-blueprint";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Services = Extract<BlueprintSection, { type: "services" }>;
type ServiceItem = {
  name: string;
  description: string;
  price: string;
  duration: string;
  cta: string;
};

export function ServicesSection({ section }: { section: Services }) {
  return (
    <section id="services" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight">{section.headline}</h2>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {section.items.map((item: ServiceItem, i: number) => (
          <Card key={i} className="rounded-2xl border-border/60 bg-card/70">
            <CardHeader>
              <CardTitle className="text-xl">{item.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{item.description}</p>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                {item.price ? (
                  <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
                    {item.price}
                  </span>
                ) : null}
                {item.duration ? (
                  <span className="text-muted-foreground">{item.duration}</span>
                ) : null}
              </div>
              {item.cta ? (
                <Button asChild variant="secondary" className="rounded-xl">
                  <a href="#contact">{item.cta}</a>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
