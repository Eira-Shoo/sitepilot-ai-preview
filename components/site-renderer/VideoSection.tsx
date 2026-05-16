import type { BlueprintSection } from "@/lib/validators/website-blueprint";

type V = Extract<BlueprintSection, { type: "video" }>;

function isYouTube(url: string) {
  return /youtube\.com|youtu\.be/i.test(url);
}

function toEmbed(url: string) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed/${u.pathname.replace("/", "")}`;
    }
    const id = u.searchParams.get("v");
    if (id) return `https://www.youtube.com/embed/${id}`;
  } catch {
    /* ignore */
  }
  return null;
}

export function VideoSection({ section }: { section: V }) {
  const url = section.videoUrl?.trim() ?? "";
  if (!url) return null;

  const embed = isYouTube(url) ? toEmbed(url) : null;

  return (
    <section className="border-y border-border/60 bg-muted/10 py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <h2 className="text-center text-3xl font-semibold tracking-tight">{section.headline}</h2>
        {section.description ? (
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-muted-foreground">
            {section.description}
          </p>
        ) : null}
        <div className="mt-10 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-lg">
          {embed ? (
            <div className="aspect-video w-full">
              <iframe
                title="Video"
                src={embed}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <video controls className="aspect-video w-full bg-black" src={url} preload="metadata" />
          )}
        </div>
      </div>
    </section>
  );
}
