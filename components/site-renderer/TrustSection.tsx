import type { BlueprintSection } from "@/lib/validators/website-blueprint";
import { ShieldCheck, Star } from "lucide-react";
import { SECTION_CONTAINER } from "./section-styles";

type Trust = Extract<BlueprintSection, { type: "trust" }>;

export function TrustSection({ section }: { section: Trust }) {
  const items = section.items.slice(0, 4);

  return (
    <section className="border-b border-border/40 bg-muted/15 py-12 sm:py-14">
      <div className={SECTION_CONTAINER}>
        <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground sm:text-sm">
          {section.headline || "Why clients trust us"}
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item: string, i: number) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-2xl border border-border/50 bg-card/80 px-5 py-4 shadow-sm"
            >
              {i === 0 ? (
                <Star className="h-6 w-6 shrink-0 text-[var(--sp-secondary,#c9a227)]" />
              ) : (
                <ShieldCheck className="h-6 w-6 shrink-0 text-[var(--sp-secondary,#c9a227)]" />
              )}
              <p className="text-base font-medium leading-snug">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
