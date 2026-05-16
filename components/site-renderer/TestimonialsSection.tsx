import type { BlueprintSection } from "@/lib/validators/website-blueprint";
import { Card, CardContent } from "@/components/ui/card";

type T = Extract<BlueprintSection, { type: "testimonials" }>;
type TestimonialItem = { quote: string; name: string; role: string };

export function TestimonialsSection({ section }: { section: T }) {
  const real = section.items.filter((item: TestimonialItem) => item.quote?.trim());

  return (
    <section className="border-y border-border/60 bg-muted/15 py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-center text-3xl font-semibold tracking-tight">
          {section.headline}
        </h2>

        {real.length === 0 ? (
          <p className="mx-auto mt-8 max-w-xl text-center text-sm leading-relaxed text-muted-foreground">
            New offer — first customer reviews will be added after launch.
          </p>
        ) : (
          <>
            <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-muted-foreground">
              Shared with permission from real clients.
            </p>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {real.map((item: TestimonialItem, i: number) => (
                <Card key={i} className="rounded-2xl border-border/60 bg-card/80">
                  <CardContent className="space-y-4 p-6">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      “{item.quote}”
                    </p>
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.role}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
