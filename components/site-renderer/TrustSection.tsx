import type { BlueprintSection } from "@/lib/validators/website-blueprint";
import { ShieldCheck, Star } from "lucide-react";

type Trust = Extract<BlueprintSection, { type: "trust" }>;

export function TrustSection({ section }: { section: Trust }) {
  return (
    <section className="border-b border-border/40 bg-muted/10 py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          {section.headline}
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {section.items.map((item: string, i: number) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card/70 px-4 py-3.5 shadow-sm"
            >
              {i === 0 ? (
                <Star className="h-5 w-5 shrink-0 text-[var(--sp-secondary,#c9a227)]" />
              ) : (
                <ShieldCheck className="h-5 w-5 shrink-0 text-[var(--sp-secondary,#c9a227)]" />
              )}
              <p className="text-sm font-medium leading-snug">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
