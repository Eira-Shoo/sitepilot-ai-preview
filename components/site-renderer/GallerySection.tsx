import type { BlueprintSection } from "@/lib/validators/website-blueprint";
import { Card, CardContent } from "@/components/ui/card";

type G = Extract<BlueprintSection, { type: "gallery" }>;

export function GallerySection({ section }: { section: G }) {
  return (
    <section className="border-y border-border/60 py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-center text-3xl font-semibold tracking-tight">
          {section.headline}
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {section.items.map((item, i) => (
            <Card key={i} className="overflow-hidden rounded-2xl border-border/60">
              <div className="aspect-[4/3] bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20" />
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{item.imagePrompt}</p>
                {item.caption ? (
                  <p className="mt-2 text-sm font-medium">{item.caption}</p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
