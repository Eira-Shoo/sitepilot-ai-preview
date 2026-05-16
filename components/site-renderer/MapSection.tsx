import type { BlueprintSection } from "@/lib/validators/website-blueprint";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

type M = Extract<BlueprintSection, { type: "map" }>;

export function MapSection({ section }: { section: M }) {
  const query = section.address || section.placeId;
  const fallbackMapsUrl = query
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
    : undefined;
  const externalMapsHref = section.mapsLink?.trim() || fallbackMapsUrl;
  const embedKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;
  const embedSrc =
    embedKey && section.address
      ? `https://www.google.com/maps/embed/v1/place?key=${embedKey}&q=${encodeURIComponent(section.address)}`
      : null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">{section.headline}</h2>
          {section.address ? (
            <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {section.address}
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Add an address in your project to show a map module.
            </p>
          )}
          {section.openingHours?.trim() ? (
            <div className="mt-4 rounded-xl border border-border/60 bg-card/40 p-4 text-sm">
              <p className="font-medium text-foreground">Opening hours</p>
              <p className="mt-2 whitespace-pre-line text-muted-foreground">{section.openingHours}</p>
            </div>
          ) : null}
        </div>
        {externalMapsHref ? (
          <Button asChild variant="outline" className="rounded-xl">
            <a href={externalMapsHref} target="_blank" rel="noreferrer">
              Open in Google Maps
            </a>
          </Button>
        ) : null}
      </div>
      {embedSrc ? (
        <div className="mt-8 overflow-hidden rounded-2xl border border-border/60 shadow-lg">
          <iframe
            title="Google Map"
            src={embedSrc}
            className="h-80 w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      ) : null}
    </section>
  );
}
