import type { BlueprintSection } from "@/lib/validators/website-blueprint";

type P = Extract<BlueprintSection, { type: "process" }>;
type ProcessStep = { title: string; description: string };

export function ProcessSection({ section }: { section: P }) {
  return (
    <section id="process" className="border-y border-border/60 bg-muted/10 py-16 lg:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-[var(--sp-secondary,#c9a227)]">
            Process
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">{section.headline}</h2>
        </div>
        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {section.items.map((step: ProcessStep, i: number) => (
            <li
              key={i}
              className="relative rounded-2xl border border-border/60 bg-card/80 p-6 shadow-sm"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--sp-secondary,#c9a227)]/20 text-sm font-bold text-[var(--sp-secondary,#c9a227)]">
                {i + 1}
              </span>
              <p className="mt-4 text-lg font-semibold">{step.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
