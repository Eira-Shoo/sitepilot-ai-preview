import type { BlueprintSection } from "@/lib/validators/website-blueprint";
import { CheckCircle2 } from "lucide-react";

type Trust = Extract<BlueprintSection, { type: "trust" }>;

export function TrustSection({ section }: { section: Trust }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <h2 className="text-center text-3xl font-semibold tracking-tight">
        {section.headline}
      </h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {section.items.map((item: string, i: number) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card/60 p-4"
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <p className="text-sm leading-relaxed">{item}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
