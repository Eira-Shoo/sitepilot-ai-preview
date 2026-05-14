import type { BlueprintSection } from "@/lib/validators/website-blueprint";
import { Card, CardContent } from "@/components/ui/card";

type B = Extract<BlueprintSection, { type: "before_after" }>;

export function BeforeAfterSection({ section }: { section: B }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h2 className="text-center text-3xl font-semibold tracking-tight">
        {section.headline}
      </h2>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <Card className="rounded-2xl border-border/60">
          <CardContent className="space-y-3 p-6">
            <p className="text-sm font-medium">{section.beforeCaption || "Before"}</p>
            <div className="aspect-video rounded-xl bg-muted" />
            <p className="text-xs text-muted-foreground">{section.beforeImagePrompt}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/60">
          <CardContent className="space-y-3 p-6">
            <p className="text-sm font-medium">{section.afterCaption || "After"}</p>
            <div className="aspect-video rounded-xl bg-gradient-to-br from-primary/30 to-secondary/20" />
            <p className="text-xs text-muted-foreground">{section.afterImagePrompt}</p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
