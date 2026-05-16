import type { BlueprintSection } from "@/lib/validators/website-blueprint";
import { VisualPlaceholder } from "./VisualPlaceholder";

type G = Extract<BlueprintSection, { type: "gallery" }>;
type GalleryItem = { imagePrompt: string; caption: string; imageUrl: string };

export function GallerySection({ section }: { section: G }) {
  return (
    <section id="gallery" className="border-y border-border/60 py-16 lg:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-[var(--sp-secondary,#c9a227)]">
            Gallery
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">{section.headline}</h2>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {section.items.map((item: GalleryItem, i: number) => (
            <article
              key={i}
              className="overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-sm"
            >
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageUrl}
                  alt={item.caption || item.imagePrompt || "Gallery"}
                  className="aspect-[4/3] w-full object-cover"
                />
              ) : (
                <VisualPlaceholder
                  imagePrompt={item.imagePrompt}
                  label="Gallery"
                  aspectClass="aspect-[4/3]"
                  className="rounded-none border-0"
                />
              )}
              {item.caption ? (
                <p className="border-t border-border/40 px-4 py-3 text-sm font-medium">{item.caption}</p>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
