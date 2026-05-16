import type { BlueprintSection } from "@/lib/validators/website-blueprint";
import { Card, CardContent } from "@/components/ui/card";

type G = Extract<BlueprintSection, { type: "gallery" }>;
type GalleryItem = { imagePrompt: string; caption: string; imageUrl: string };

export function GallerySection({ section }: { section: G }) {
  return (
    <section className="border-y border-border/60 py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-center text-3xl font-semibold tracking-tight">
          {section.headline}
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {section.items.map((item: GalleryItem, i: number) => (
            <Card key={i} className="overflow-hidden rounded-2xl border-border/60">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageUrl}
                  alt={item.caption || item.imagePrompt || "Gallery"}
                  className="aspect-[4/3] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[4/3] items-end bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20 p-4">
                  {item.imagePrompt ? (
                    <p className="text-xs text-muted-foreground">Image direction: {item.imagePrompt}</p>
                  ) : (
                    <span className="text-xs text-muted-foreground">Visual placeholder</span>
                  )}
                </div>
              )}
              <CardContent className="p-4">
                {!item.imageUrl && item.imagePrompt ? (
                  <p className="text-xs text-muted-foreground">{item.imagePrompt}</p>
                ) : null}
                {item.caption ? <p className="mt-2 text-sm font-medium">{item.caption}</p> : null}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
